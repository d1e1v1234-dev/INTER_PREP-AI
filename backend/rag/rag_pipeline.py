from backend.rag.document_loader import DocumentLoader
from backend.rag.text_splitter import TextSplitter
from backend.rag.embeddings import EmbeddingModel
from backend.rag.vector_store import VectorStore
from backend.rag.retriever import Retriever


class RAGPipeline:

    def __init__(self):
        self.loader = DocumentLoader()
        self.splitter = TextSplitter()
        self.embedding = EmbeddingModel()

        self.db = None
        self.retriever = None

    def load_document(self, pdf_path: str):

        text = self.loader.load_pdf(pdf_path)

        chunks = self.splitter.split_text(text)

        vector_store = VectorStore(self.embedding.get_embedding())

        self.db = vector_store.create_vector_store(chunks)

        self.retriever = Retriever(self.db)

    def retrieve(self, query: str):

        if self.retriever is None:
            return ""

        docs = self.retriever.retrieve(query)

        return "\n\n".join(doc.page_content for doc in docs)