if __name__ == "__main__":
    import os
    import uvicorn
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv())
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("src.main:app", host="127.0.0.1", port=port, reload=True)