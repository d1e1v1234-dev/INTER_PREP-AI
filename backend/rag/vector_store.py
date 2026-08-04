from langchain_community.vectorstores import FAISS


class VectorStore:

    def __init__(self, embedding_model):
        self.embedding_model = embedding_model

    def create_vector_store(self, chunks):
        vector_store = FAISS.from_texts(
            texts=chunks,
            embedding=self.embedding_model
        )
        return vector_store