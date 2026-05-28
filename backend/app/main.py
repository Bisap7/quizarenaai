from fastapi import FastAPI
from .questions import questions
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

quiz_sessions ={}

global_high_score = {
    "user": None,
    "score": 0
}

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

@app.post("/start-quiz")
def start_quiz(data:dict):
    user_id = data["user_id"]

    quiz_sessions[user_id] = {
        "score": 0,
        "answered_questions": [],
        "is_completed": False,
        "final_score": None
    }

    return {
        "message": f"Quiz started for {user_id}",
        "score": 0
    }


# check answer
@app.post("/check-answer")
def check_answer(request_data: dict):

    selected_question_id = request_data["question_id"]
    player_selected_option = request_data["answer"]
    current_player_id = request_data["user_id"]

    # check if player started quiz
    if current_player_id not in quiz_sessions:
        return {"error": "Quiz not started"}

    session = quiz_sessions[current_player_id]

    # prevent answering if quiz already finished
    if session["is_completed"]:
        return {
            "message": "Quiz already completed",
            "final_score": session["final_score"]
        }

    # prevent duplicate answering
    if selected_question_id in session["answered_questions"]:
        return {"error": "Question already answered"}

    # find question
    for current_question in questions:

        if current_question["id"] == selected_question_id:

            is_correct = current_question["answer"] == player_selected_option

            # update answered list
            session["answered_questions"].append(selected_question_id)

            # update score
            if is_correct:
                session["score"] += 1

            # check completion AFTER updating state
            if len(session["answered_questions"]) == len(questions):
                session["is_completed"] = True
                session["final_score"] = session["score"]

                return {
                    "is_correct": is_correct,
                    "message": "Quiz completed automatically",
                    "final_score": session["final_score"]
                }

            # normal response (not finished yet)
            if is_correct:
                return {
                    "is_correct": True,
                    "current_score": session["score"]
                }
            else:
                return {
                    "is_correct": False,
                    "correct_option": current_question["answer"],
                    "current_score": session["score"]
                }

    return {"error": "Question not found"}
@app.get("/result/{user_id}")
def get_result(user_id: str):

    if user_id not in quiz_sessions:
        return {"error": "Quiz not started"}

    return {
        "user_id": user_id,
        "final_score": quiz_sessions[user_id].get("final_score", quiz_sessions[user_id]["score"]),
        "total_questions": len(questions)
    }

@app.get("/leaderboard")
def leaderboard():

    # sort players by highest score
    sorted_players = sorted(
        quiz_sessions.items(),
        key=lambda player: player[1].get("score", 0),
        reverse=True
    )

    leaderboard_data = []

    # create leaderboard response
    for player_name, player_data in sorted_players:

        leaderboard_data.append({
            "user": player_name,
            "score": player_data["score"],
            "total": len(questions)
        })

    return leaderboard_data

@app.get("/check-completion/{user_id}")
def check_completion(user_id: str):

    # check if user exists
    if user_id not in quiz_sessions:
        return {"error": "Quiz not started"}

    user_data = quiz_sessions[user_id]

    answered_count = len(user_data["answered_questions"])
    total_questions = len(questions)

    # check completion status
    is_completed = answered_count >= total_questions

    return {
        "user_id": user_id,
        "is_completed": is_completed,
        "answered_questions": answered_count,
        "total_questions": total_questions,
        "remaining_questions": total_questions - answered_count
    }

@app.post("/submit-quiz/{user_id}")
def submit_quiz(user_id: str):

    if user_id not in quiz_sessions:
        return {"error": "Quiz not started"}

    session = quiz_sessions[user_id]

    session["is_completed"] = True
    session["final_score"] = session["score"]

    global global_high_score

    # update global high score if beaten
    if session["score"] > global_high_score["score"]:
        global_high_score["user"] = user_id
        global_high_score["score"] = session["score"]

    return {
        "message": "Quiz submitted successfully",
        "user_id": user_id,
        "final_score": session["final_score"],
        "total_questions": len(questions),
        "answered_questions": len(session["answered_questions"]),
        "is_new_high_score": session["score"] == global_high_score["score"]
    }

@app.get("/high-score")
def get_high_score():

    if global_high_score["user"] is None:
        return {
            "message": "No scores yet"
        }

    return {
        "user": global_high_score["user"],
        "high_score": global_high_score["score"]
    }