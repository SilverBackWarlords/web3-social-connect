# To run this code you need to install the following dependencies:
# pip install google-genai

import os
from google import genai
from google.genai import types

def generate():
    # 1. Initialize Client
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-3-pro-preview" 
    
    # --- PROMPT CONTENT ---
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text="""
                    Based on the current date, what is the latest official news on the development 
                    of quantum computing, and provide the answer in a structured JSON array 
                    format listing the source, date, and key takeaway.
                    """
                ),
            ],
        ),
    ]

    # --- TOOLS ---
    tools = [
        types.Tool(google_search=types.GoogleSearch()),
    ]
    
    # 2. Configure Advanced Gemini 3 Generation Settings
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
            include_thoughts=True,
        ),
        media_resolution="MEDIA_RESOLUTION_HIGH",
        system_instruction="You are a meticulous and powerful research agent.",
        response_mime_type="application/json",
        tools=tools,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_ONLY_HIGH"),
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_ONLY_HIGH"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
        ],
    )

    # 3. Stream and Print the Response (including thought parts)
    print("--- Generating Content (Streaming with Thoughts) ---")
    
    response_stream = client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    )
    
    for chunk in response_stream:
        for part in chunk.candidates[0].content.parts:
            if part.thought:
                print(f"\n[THOUGHT SUMMARY]: {part.text.strip()}")
            elif part.text:
                print(part.text, end="")
        
    print("\n--- End of Generation ---")


if __name__ == "__main__":
    generate()
