from fastapi import APIRouter, HTTPException
from app.services.llm.llm import llm
from langchain.prompts import ChatPromptTemplate
from langchain.agents import create_tool_calling_agent, AgentExecutor
from app.services.llm.prompt import PROMPT
from app.services.llm.agent import TOOLS
from app.db.mongoDB.mongo import topics_collection
from bson import ObjectId
from langchain.schema import HumanMessage, AIMessage

router = APIRouter()

@router.post("/{owner}/{repo_name}/{topic_id}")
def chat_about_repo(owner: str, repo_name: str, topic_id: str, query: str):
    conversation = []

    if topic_id != "new":
        topic = topics_collection.find_one(
            {"_id": ObjectId(topic_id), "owner": owner, "repo_name": repo_name}
        )
        if topic and "messages" in topic:
            for msg in topic["messages"]:
                if msg["role"] == "human":
                    conversation.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "ai":
                    conversation.append(AIMessage(content=msg["content"]))


    prompt = ChatPromptTemplate.from_messages([
        ("system", PROMPT),
        ("placeholder", "{conversation}"),
        ("human", "{query}"),
        ('placeholder','{agent_scratchpad}')
    ])

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

    raw_res = agent_executor.invoke({
        "query": query,
        "conversation": conversation
    })

    answer = raw_res["output"] if "output" in raw_res else str(raw_res)

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

    else:
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
    topic = topics_collection.find_one(
        {
            "_id": topic_id,
            "owner": owner,
            "repo_name": repo_name
        },
        {"_id": 1, "messages": 1, "topic_name": 1}
    )

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Convert messages into LangChain message objects
    formatted_messages = []
    for msg in topic.get("messages", []):
        if msg.get("role") == "human":
            formatted_messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "ai":
            formatted_messages.append(AIMessage(content=msg["content"]))

    return {
        "topic_id": str(topic["_id"]),
        "topic_name": topic.get("topic_name", ""),
        "messages": [m.dict() for m in formatted_messages]
    }


