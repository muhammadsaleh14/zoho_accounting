# import easyocr
# import numpy as np
# import cv2
#
# # Initialize the Reader once (Global variable) to avoid reloading it on every request
# # 'en' = English. You can add 'ar' for Arabic later if needed.
# reader = easyocr.Reader(['en'], gpu=False) # Set gpu=True if you have NVIDIA CUDA
#
# def extract_text_from_image(image_bytes: bytes) -> list[str]:
#     """
#     Uses EasyOCR to read text from the image bytes.
#     Returns a list of strings found on the page.
#     """
#     # 1. Convert bytes to a format OpenCV understands
#     nparr = np.frombuffer(image_bytes, np.uint8)
#     image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#
#     # 2. Run OCR
#     # detail=0 means "Just give me the text, not the coordinates"
#     results = reader.readtext(image, detail=0)
#
#     return results
