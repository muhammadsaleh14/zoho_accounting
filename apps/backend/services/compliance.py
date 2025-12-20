import re
from typing import List

def analyze_compliance(extracted_text_list: List[str]):
    """
    Analyzes OCR text with 'Fuzzy' logic to handle OCR typos (o vs 0) 
    and multi-line layouts.
    """
    
    # 1. Cleaning: Join text but keep list for line-by-line analysis
    full_text = " ".join(extracted_text_list).upper()
    
    issues = []
    score = 1.0
    extracted_data = {
        "vendor": "Unknown Vendor",
        "trn": None,
        "date": None,
        "total": 0.0
    }

    # --- 1. HEADER CHECK ---
    if "TAX INVOICE" not in full_text:
        issues.append("Missing 'Tax Invoice' Header")
        score -= 0.30

    # --- 2. TRN CHECK (OCR Typo Fix) ---
    # Problem: OCR read "1230000o0000000" (Letter o instead of 0)
    # Fix: We look for "TRN" then capture the messy string next to it, then clean it.
    
    # Logic: Find "TRN", allow junk characters (: . -), then capture 15 chars that are digits OR 'o'/'O'
    trn_pattern = r"(?:TRN|T\.R\.N)[\s:.-]*([0-9oO]{13,16})"
    trn_match = re.search(trn_pattern, full_text, re.IGNORECASE)
    
    if trn_match:
        # Clean the result: Replace 'O' with '0'
        raw_trn = trn_match.group(1).upper().replace('O', '0')
        extracted_data["trn"] = raw_trn
    else:
        # Fallback: Look for any 15-digit-like blob
        alt_trn = re.search(r"\b[0-9oO]{15}\b", full_text)
        if alt_trn:
             extracted_data["trn"] = alt_trn.group(0).upper().replace('O', '0')
        else:
            issues.append("Missing or Invalid TRN")
            score -= 0.30

    # --- 3. DATE CHECK (Date Formats) ---
    # Handles: 1-Jan-2018, 12/12/2025
    date_pattern = r"(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(?:\d{1,2}[-/\s](?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[-/\s]\d{2,4})"
    date_match = re.search(date_pattern, full_text, re.IGNORECASE)
    
    if date_match:
        extracted_data["date"] = date_match.group(0)
        # Age Check
        if "2018" in extracted_data["date"] or "2019" in extracted_data["date"]:
             issues.append("Warning: Invoice is too old (>5 years)")
             score -= 0.20
    else:
        issues.append("Date not clearly visible")
        score -= 0.10

    # --- 4. TOTAL AMOUNT (Multi-line Search) ---
    # Problem: "Total" is on line 39, "1,050" is on line 41.
    # Fix: When we see "Total", look at the NEXT 3 lines too.
    
    money_pattern = r"[\d,]+\.\d{2}|[\d,]{3,}" # Matches 1,050 or 10.50
    total_found = False
    
    for i, line in enumerate(extracted_text_list):
        # Clean line
        clean_line = line.upper().replace(" ", "")
        
        if "TOTAL" in clean_line and "SUB" not in clean_line:
            # Check THIS line and the NEXT 3 lines
            search_window = extracted_text_list[i : i+4] 
            
            for context_line in search_window:
                amounts = re.findall(money_pattern, context_line)
                for amt in amounts:
                    try:
                        # Clean comma (1,050 -> 1050)
                        val = float(amt.replace(',', ''))
                        # Sanity check: Total usually isn't 5 (Quantity)
                        if val > 10.0: 
                            extracted_data["total"] = val
                            total_found = True
                            break # Break inner loop
                    except:
                        continue
                if total_found: break # Break search window loop
        if total_found: break # Break main loop

    if not total_found:
        issues.append("Could not auto-detect Total Amount")
        score -= 0.10

    # --- 5. VENDOR GUESS (Skip Headers) ---
    # Problem: Line 1 is "Tax Invoice", Line 2 is "Name;".
    # Fix: Ignore common header words.
    
    ignore_words = ["TAX", "INVOICE", "DATE", "BILL", "TO", "FROM", "NAME", "ADDRESS"]
    
    for line in extracted_text_list[:6]: # Check first 6 lines
        clean_line = line.strip()
        # If line is short or is just a header word, skip it
        if len(clean_line) < 3 or clean_line.upper().replace(";","") in ignore_words:
            continue
            
        # If line contains Company keywords, it's a winner
        if any(x in clean_line.upper() for x in ["CO.", "LTD", "LLC", "TRADING"]):
            extracted_data["vendor"] = clean_line
            break
        
        # Fallback: First line that isn't ignored
        if extracted_data["vendor"] == "Unknown Vendor":
            extracted_data["vendor"] = clean_line

    return {
        "isCompliant": len(issues) == 0,
        "missingFields": issues,
        "confidenceScore": max(round(score, 2), 0.0),
        "extractedData": extracted_data
    }