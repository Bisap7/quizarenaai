from fastapi import FastAPI
from .questions import questions

app = FastAPI()

@app.get("/")
def home():
    return {"message": "QuizArena AI Backend Running"}

@app.get("/questions")
def get_questions():
    safe_questions = []

    for q in questions:
        safe_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })

    return safe_questions