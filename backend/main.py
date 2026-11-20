import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from ingest import collection
from fastapi import UploadFile
from ingest import add_pdf

load_dotenv()                                  
ai = Groq(api_key=os.getenv("GROQ_API_KEY"))   

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

@app.get("/")
def home():
    return {"status": "running", "pieces": collection.count()}

@app.post("/ask")
def ask(q: Question):
   
    results = collection.query(query_texts=[q.question], n_results=4)
    pieces = results["documents"][0]
    sources = results["metadatas"][0]

    
    notes = "\n\n".join(pieces)
    prompt = f"""You are a friendly teacher. Answer the question using ONLY these notes in simple words, and include one short example. If the answer is not in the notes, say "Not found in your notes."

    Notes:
    {notes}

    Question: {q.question}"""

    reply = ai.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
    answer = reply.choices[0].message.content
    return {"answer": answer, "sources": sources}

@app.post("/upload")
def upload(file: UploadFile):
    name = os.path.basename(file.filename)
    path = os.path.join("docs", name)
    with open(path, "wb") as f:
        f.write(file.file.read())
    count = add_pdf(path)
    return {"message": f"Added {name} ({count} pieces). Ask me!"}
