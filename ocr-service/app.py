from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import io

# Configurar ruta de Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)

# 🛠 Función para preprocesar imágenes antes del OCR
def preprocess_image(image_stream):
    img = Image.open(image_stream)

    # 1. Convertir a escala de grises
    img = img.convert('L')

    # 2. Mejorar el contraste
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2)  # ⚡ 2 veces más contraste

    # 3. Aplicar filtro para reducir ruido
    img = img.filter(ImageFilter.MedianFilter())

    return img

@app.route('/ocr', methods=['POST'])
def ocr_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No se envió imagen'}), 400

    image = request.files['image']

    # 👇 Aplicamos preprocesamiento
    img = preprocess_image(image.stream)

    # 👇 Configuraciones adicionales para mejorar OCR
    custom_config = r'--oem 3 --psm 6'
    
    text = pytesseract.image_to_string(img, config=custom_config, lang='spa')

    return jsonify({'text': text})

if __name__ == '__main__':
    app.run(port=5000, debug=True)

