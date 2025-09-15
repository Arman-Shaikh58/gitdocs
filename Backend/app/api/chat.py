from fastapi import APIRouter, HTTPException
from app.services.llm.llm import llm
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import create_tool_calling_agent, AgentExecutor
from app.services.llm.prompt import PROMPT
from app.services.llm.agent import TOOLS, TOOLS_DESC
from app.db.mongoDB.mongo import topics_collection
from bson import ObjectId

router = APIRouter()


def normalize_messages(messages: list) -> list[dict]:
    """
    Ensure all messages are dicts with {role, content}.
    Flattens any accidental nested arrays.
    """
    normalized = []
    for msg in messages:
        if isinstance(msg, dict):
            normalized.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })
        elif isinstance(msg, list):  # handle bad nested arrays
            for inner in msg:
                if isinstance(inner, dict):
                    normalized.append({
                        "role": inner.get("role"),
                        "content": inner.get("content")
                    })
    return normalized


@router.post("/{owner}/{repo_name}/{topic_id}")
def chat_about_repo(owner: str, repo_name: str, topic_id: str, query: str):
    """
    Chat with the LLM about a repo and save conversation into MongoDB.
    """
    # Build conversation history
    conversation = []
    if topic_id != "new":
        topic = topics_collection.find_one(
            {"_id": ObjectId(topic_id), "owner": owner, "repo_name": repo_name}
        )
        if topic and "messages" in topic:
            conversation = normalize_messages(topic["messages"])

    # Prompt setup
    prompt = ChatPromptTemplate.from_messages([
        ("system", PROMPT),
        MessagesPlaceholder("conversation"),
        ("human", "{query}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    # Create agent
    agent = create_tool_calling_agent(
        llm=llm,
        prompt=prompt,
        tools=TOOLS
    )

    agent_executor = AgentExecutor(
        agent=agent,
        tools=TOOLS,
        verbose=True
    )

    # Run agent safely
    try:
        raw_res = agent_executor.invoke({
            "query": query,
            "conversation": conversation,
            "TOOLS_DESC": TOOLS_DESC,
            "collection_name": f"{owner}_{repo_name}"
        })
        answer = raw_res.get("output", str(raw_res))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

    # Save new topic
    if topic_id == "new":
        new_topic = {
            "owner": owner,
            "repo_name": repo_name,
            "topic_name": query[:50],  # first few words as title
            "messages": [
                {"role": "human", "content": query},
                {"role": "ai", "content": answer}
            ]
        }
        result = topics_collection.insert_one(new_topic)
        return {
            "topic_id": str(result.inserted_id),
            "response": answer
        }

    # Update existing topic
    topics_collection.update_one(
        {"_id": ObjectId(topic_id)},
        {"$push": {"messages": [
            {"role": "human", "content": query},
            {"role": "ai", "content": answer}
        ]}}
    )
    return {
        "topic_id": topic_id,
        "response": answer
    }


@router.get("/{owner}/{repo_name}/{topic_id}/messages")
def get_topic_messages(owner: str, repo_name: str, topic_id: str):
    """
    Get all messages of a topic from MongoDB.
    """
    try:
        topic = topics_collection.find_one(
            {
                "_id": ObjectId(topic_id),
                "owner": owner,
                "repo_name": repo_name
            },
            {"_id": 1, "messages": 1, "topic_name": 1}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid topic ID")

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Normalize stored messages
    messages = normalize_messages(topic.get("messages", []))

    return {
        "topic_id": str(topic["_id"]),
        "topic_name": topic.get("topic_name", ""),
        "messages": messages
    }
