import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .db import get_products, set_embedding, search_vector

_model=None

def text_of(p): return ' '.join([p['name'],p['category'],p['description']] + list(p['features']))

def ensure_embeddings():
    global _model
    try:
        from sentence_transformers import SentenceTransformer
        if _model is None: _model=SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        products=get_products()
        for p in products:
            from .db import conn
            with conn() as c: row=c.execute('SELECT embedding FROM products WHERE id=%s',(p['id'],)).fetchone()
            if not row or row['embedding'] is None:
                vec=_model.encode(text_of(p),normalize_embeddings=True)
                set_embedding(p['id'],vec)
    except Exception:
        pass

def semantic_search(query,limit=8):
    try:
        ensure_embeddings()
        vec=_model.encode(query,normalize_embeddings=True)
        return search_vector(vec,limit)
    except Exception:
        products=get_products(); corpus=[text_of(p) for p in products]
        v=TfidfVectorizer(stop_words='english'); X=v.fit_transform(corpus); q=v.transform([query]); sims=cosine_similarity(q,X)[0]
        ranked=np.argsort(-sims)[:limit]
        out=[]
        for i in ranked:
            if sims[i]>0: out.append(dict(products[i],similarity=float(sims[i])))
        return out

def rank_products(products,query=''):
    if not products:return []
    terms=set(re.findall(r'[a-z0-9]+',query.lower()))
    ranked=[]
    for p in products:
        text=text_of(p).lower(); matches=sum(1 for t in terms if t in text)
        score=0.55*(float(p['rating'])/5)+0.25*min(matches/4,1)+0.20*(1/(1+float(p['price'])/100))
        ranked.append((score,p))
    return [dict(p,rank_score=round(s,4)) for s,p in sorted(ranked,key=lambda x:x[0],reverse=True)]
