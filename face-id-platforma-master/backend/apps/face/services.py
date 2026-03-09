"""
Face recognition service.
Uses face_recognition library if installed, otherwise provides a stub.
"""
import base64
import hashlib
import io

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    class MockNumpy:
        def array(self, *args, **kwargs): return []
        def zeros(self, *args, **kwargs): return []
    np = MockNumpy()
    NUMPY_AVAILABLE = False

try:
    import face_recognition as fr
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    fr = None
    FACE_RECOGNITION_AVAILABLE = False


def decode_base64_image(b64_string: str):
    """Decode base64 string to PIL/numpy image."""
    from PIL import Image
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    img_bytes = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    return np.array(img)


def get_face_encodings(image_array):
    """Return list of face encodings from numpy array image."""
    if not FACE_RECOGNITION_AVAILABLE:
        raise ImportError("face_recognition library is not installed")
    return fr.face_encodings(image_array)


def compare_to_stored(incoming_encoding, face_encoding_qs, threshold: float = 0.60):
    """
    Compare incoming_encoding against a queryset of FaceEncoding objects.
    Returns (user, distance) for the best match under threshold, else (None, 1.0).
    """
    best_user = None
    best_distance = 1.0

    for fe in face_encoding_qs:
        stored = fe.get_encoding()
        distances = fr.face_distance([stored], incoming_encoding)
        dist = float(distances[0])
        if dist < best_distance:
            best_distance = dist
            if dist < threshold:
                best_user = fe.user

    return best_user, best_distance


def hash_image(b64_string: str) -> str:
    return hashlib.sha256(b64_string.encode()).hexdigest()
