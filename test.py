from backend.rag.document_loader import DocumentLoader
from backend.rag.text_splitter import TextSplitter
from backend.rag.embeddings import EmbeddingModel
from backend.rag.vector_store import VectorStore
from backend.rag.retriever import Retriever

# Load PDF
loader = DocumentLoader()
text = loader.load_pdf("dl-curriculum.pdf")

# Split into chunks
splitter = TextSplitter()
chunks = splitter.split_text(text)

# Create embeddings
embedding = EmbeddingModel()

# Create Vector DB
vector_store = VectorStore(embedding.get_embedding())
db = vector_store.create_vector_store(chunks)

print("Vector DB Created Successfully!")

# Create Retriever
retriever = Retriever(db)

# Retrieve relevant chunks
docs = retriever.retrieve(
    "What projects are mentioned in this document?"
)

print("=" * 50)

for doc in docs:
    print(doc.page_content)
    print("-" * 50)