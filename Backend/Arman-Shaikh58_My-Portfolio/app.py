from flask import Flask, render_template, request, flash, redirect, url_for, jsonify,send_from_directory
from flask_mail import Mail, Message
import threading
import logging
from dotenv import load_dotenv
import os
documents=[
        {"id":2360581,"fname":"AISSMS.pdf"},
        {"id":2360512,"fname":"Event.jpg"},
        {"id":2360513,"fname":"PJC.pdf"},
        {"id":2360514,"fname":"SCC.pdf"}
    ]
# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# App initialization
app = Flask(__name__, template_folder="Frontend/templates", static_folder="Frontend/static")
app.secret_key = os.getenv('SECRET_KEY')

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
app.config['MAIL_MAX_EMAILS'] = int(os.getenv('MAIL_MAX_EMAILS'))
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL') == 'True'
app.config['MAIL_DEBUG'] = os.getenv('MAIL_DEBUG') == 'True'

mail = Mail(app)

# Home route
@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        message = request.form.get("message")

        if not name or not email or not message:
            flash("All fields are required.", "error")
            return redirect(url_for("home"))

        msg = Message(
            subject="New Message from Portfolio",
            sender=app.config["MAIL_DEFAULT_SENDER"],
            recipients=[app.config["MAIL_USERNAME"]],
            body=f"Name: {name}\nEmail: {email}\nMessage: {message}"
        )

        mail.send(msg)

        flash("Message sent successfully!", "success")
        return redirect(url_for("home"))

    return render_template("index.html")

@app.route('/achivements/<int:id>')
def get_achive(id):
    pdf=next(item for item in documents if item["id"]==id)
    return send_from_directory('Frontend/static/files',pdf['fname'],as_attachment=False)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

