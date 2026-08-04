class Retriever:

    def __init__(self, vector_store):
        self.retriever = vector_store.as_retriever(
            search_kwargs={"k": 3}
        )

    def retrieve(self, query: str):
        docs = self.retriever.invoke(query)
        return docs