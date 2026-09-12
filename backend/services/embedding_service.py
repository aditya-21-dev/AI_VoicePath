from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List

class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Loads the pre-trained SentenceTransformer model.
        """
        self.model = SentenceTransformer(model_name)
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates an embedding for a single string.
        """
        embedding = self.model.encode(text)
        return embedding.tolist()
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for multiple strings efficiently.
        """
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
    
    def calculate_similarity(self, emb1: List[float], emb2: List[float]) -> float:
        """
        Calculates cosine similarity between two embeddings.
        """
        return float(cosine_similarity([emb1], [emb2])[0][0])
