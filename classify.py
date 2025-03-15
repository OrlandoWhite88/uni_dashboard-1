#!/usr/bin/env python3
"""
Clean HS Code Classification Client

A simple script to interact with the HS code classification API.
"""

import sys
import json
import requests

API_BASE_URL = "https://arif-pixie.ngrok.app"

def classify_product(product_description, max_questions=3):
    """Start a classification session"""
    url = f"{API_BASE_URL}/classify"
    payload = {
        "product": product_description,
        "interactive": True,
        "max_questions": max_questions
    }
    
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        sys.exit(1)
    
    try:
        return response.json()
    except:
        return response.text

def continue_classification(state, answer):
    """Continue an ongoing classification session"""
    url = f"{API_BASE_URL}/classify/continue"
    payload = {
        "state": state,
        "answer": answer
    }
    
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        sys.exit(1)
    
    try:
        return response.json()
    except:
        return response.text

def main():
    # Get product description
    if len(sys.argv) > 1:
        product_description = " ".join(sys.argv[1:])
    else:
        product_description = input("Enter product description: ")
    
    # Start classification process
    result = classify_product(product_description)
    
    # Process until we get a final result
    while True:
        # If result is a string, it's the final code
        if isinstance(result, str):
            print(f"\nFinal HS Code: {result}")
            break
        
        # If result has clarification_question, ask it
        if "clarification_question" in result:
            question = result["clarification_question"]["question_text"]
            state = result["state"]
            
            print(f"\nQuestion: {question}")
            answer = input("Your answer: ")
            
            result = continue_classification(state, answer)
            continue
        
        # If result has final_code, it's the final classification
        if "final_code" in result:
            print(f"\nFinal HS Code: {result['final_code']}")
            
            # Include explanation if available
            if "enriched_query" in result:
                print(f"Product: {result['enriched_query']}")
            if "full_path" in result:
                print(f"Classification: {result['full_path']}")
            break
        
        # If we get here, we don't understand the response format
        print("Unexpected response format. Classification may be incomplete.")
        break

if __name__ == "__main__":
    main()
