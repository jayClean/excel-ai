from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO
import json
import re

app = FastAPI()

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust allowed origins for production
    allow_methods=["*"],
    allow_headers=["*"],
)

class CombineColumnsRequest(BaseModel):
    rows: List[Dict[str, Any]]
    column1: str
    column2: str
    new_column_name: str

class FilterDataRequest(BaseModel):
    rows: List[Dict[str, Any]]
    filter_condition: str

class AddColumnRequest(BaseModel):
    rows: List[Dict[str, Any]]
    new_column_name: str
    formula: str

def preprocess_condition(condition, dataframe):
    """
    Preprocesses the filter condition to add backticks around column names
    found in the DataFrame.

    Parameters:
    - condition (str): The filter condition as a string.
    - dataframe (pd.DataFrame): The DataFrame with column names to match.

    Returns:
    - str: The updated condition with backticks around column names.
    """
    columns = dataframe.columns.tolist()
    columns_pattern = "|".join([re.escape(col) for col in columns])
    condition = re.sub(rf"(?<!`)(?<!\w)({columns_pattern})(?!\w)(?!`)", r"`\1`", condition)
    return condition

@app.post("/process/add-column")
async def add_column(request: AddColumnRequest):
    try:
        # Convert the rows list into a pandas DataFrame
        rows = request.rows
        df = pd.DataFrame(rows)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Invalid data format")

    # Validate the DataFrame has at least two columns for applying formulas
    if len(df.columns) < 2:
        raise HTTPException(status_code=400, detail="File must have at least 2 columns for this operation")

    try:
        # Evaluate the formula dynamically
        # print()
        df[request.new_column_name] = df.eval(preprocess_condition(request.formula,df))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=f"Error applying formula: {str(e)}")

    # Prepare columns metadata for the frontend
    columns = [{"field": col, "headerName": col, "width": 150, "editable": True} for col in df.columns]

    # Return the updated rows and columns
    return {
        "rows": df.to_dict(orient="records"),
        "columns": columns,
    }

@app.post("/process/filter-rows")
async def filter_rows(request: FilterDataRequest):
    try:
        # Create DataFrame from the incoming rows and columns
        df = pd.DataFrame(request.rows)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid data format")
    
    try:
        # Preprocess the condition
        processed_condition = preprocess_condition(request.filter_condition, df)
        filtered_df = df.query(processed_condition)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid filter condition: {str(e)}")
    
    return {
        "rows": filtered_df.to_dict(orient="records"),
        "columns": [{"field": col, "headerName": col} for col in filtered_df.columns],
    }

@app.post("/process/combine-columns")
async def combine_columns(request: CombineColumnsRequest):
    try:
        # Create DataFrame from the incoming rows and columns
        df = pd.DataFrame(request.rows)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid data format")

    
    if request.column1 not in df.columns or request.column2 not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Columns {request.column1} and/or {request.column2} not found in the data",
        )
    
    df[request.new_column_name] = df[request.column1].astype(str) + ' ' + df[request.column2].astype(str)
    return {
        "rows": df.to_dict(orient="records"),
        "columns": [{"field": col, "headerName": col} for col in df.columns],
    }
