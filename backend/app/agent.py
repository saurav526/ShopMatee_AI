import os,json,re
from dotenv import load_dotenv
from .db import search_keyword,get_product,cart,add_cart,order
from .recommender import semantic_search,rank_products
load_dotenv()
SYSTEM='''You are ShopMate, the AI shopping agent for a demo e-commerce store.\n\nUse tools for product facts, search, recommendations, comparisons, cart and checkout. Never invent product prices, stock, ratings, product IDs or order IDs.\nFor shopping queries, prefer search_products or recommend_products. For comparisons, search first when names are mentioned. For cart and order actions, use the appropriate tool. Before checkout, confirm the cart is not empty. Checkout is simulated; no payment is processed.\nAnswer in natural, concise language. Explain tradeoffs when useful. If the user asks a general question unrelated to shopping, answer briefly without pretending to have store data.'''

def tools():
 return [
 {'type':'function','function':{'name':'search_products','description':'Search the store using natural language and optional constraints.','parameters':{'type':'object','properties':{'query':{'type':'string'},'max_price':{'type':['number','null']},'min_rating':{'type':['number','null']},'category':{'type':['string','null']}},'required':['query','max_price','min_rating','category']}}},
 {'type':'function','function':{'name':'recommend_products','description':'Recommend and rank products for an intent such as hiking, gifts, running, beginners, budget shopping.','parameters':{'type':'object','properties':{'query':{'type':'string'},'budget':{'type':['number','null']}},'required':['query','budget']}}},
 {'type':'function','function':{'name':'compare_products','description':'Compare named or identified products.','parameters':{'type':'object','properties':{'product_ids':{'type':'array','items':{'type':'integer'}}},'required':['product_ids']}}},
 {'type':'function','function':{'name':'add_to_cart','description':'Add a product to the current user cart.','parameters':{'type':'object','properties':{'product_id':{'type':'integer'},'quantity':{'type':'integer'}},'required':['product_id','quantity']}}},
 {'type':'function','function':{'name':'get_cart','description':'Read the current user cart.','parameters':{'type':'object','properties':{}}}},
 {'type':'function','function':{'name':'place_order','description':'Place a simulated order from the current user cart.','parameters':{'type':'object','properties':{},'required':[]}}}
 ]

def execute(name,args,user_id):
 if name=='search_products':
  r=search_keyword(args.get('query',''),args.get('max_price'),args.get('min_rating'),args.get('category')); return rank_products(r,args.get('query',''))
 if name=='recommend_products':
  r=semantic_search(args['query'],8); r=[x for x in r if args.get('budget') is None or float(x['price'])<=args['budget']]; return rank_products(r,args['query'])
 if name=='compare_products': return [get_product(x) for x in args['product_ids'] if get_product(x)]
 if name=='add_to_cart': return add_cart(user_id,args['product_id'],args.get('quantity',1))
 if name=='get_cart': return cart(user_id)
 if name=='place_order': return order(user_id)
 raise ValueError(name)

def fallback(message,user_id):
 low=message.lower()
 if any(x in low for x in ['cart','basket']) and any(x in low for x in ['show','what','view','my']): return {'reply':f"Your cart total is ${cart(user_id)['total']:.2f}.",'products':cart(user_id)['items'],'cart':cart(user_id)}
 if any(x in low for x in ['place order','checkout','buy now']):
  try:
   o=order(user_id); return {'reply':f"Demo order {o['order_id']} confirmed for ${o['total']:.2f}.",'products':o['items'],'cart':{'items':[],'total':0}}
  except Exception as e:return {'reply':str(e),'products':[],'cart':cart(user_id)}
 m=re.search(r'(?:under|below|less than|up to)\s*[$₹]?\s*(\d+)',low); budget=float(m.group(1)) if m else None
 r=semantic_search(message,8); r=[x for x in r if budget is None or float(x['price'])<=budget]; r=rank_products(r,message)
 return {'reply':'I found these products based on your request. Ask me to compare or add one to your cart.','products':r,'cart':cart(user_id)}

def chat(message, history, user_id):

    key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    print("\n========== SHOPMATE AI DEBUG ==========")
    print("API KEY FOUND:", bool(key))
    print("MODEL:", model)
    print("MESSAGE:", message)
    print("=======================================\n")

    if not key:
        return {
            "reply": "GROQ_API_KEY is missing.",
            "products": [],
            "cart": cart(user_id)
        }

    try:
        from groq import Groq

        client = Groq(api_key=key)

        msgs = [
            {
                "role": "system",
                "content": SYSTEM
            }
        ]

        for h in history[-12:]:
            if h.get("role") in ("user", "assistant", "tool"):
                msgs.append(h)

        msgs.append({
            "role": "user",
            "content": message
        })

        res = client.chat.completions.create(
            model=model,
            messages=msgs,
            temperature=0.15
        )

        msg = res.choices[0].message

        print("AI RESPONSE:", msg.content)

        return {
            "reply": msg.content or "Done.",
            "products": [],
            "cart": cart(user_id)
        }

    except Exception as e:

        import traceback

        print("\n========== SHOPMATE AI ERROR ==========")
        print("ERROR TYPE:", type(e).__name__)
        print("ERROR:", str(e))
        traceback.print_exc()
        print("========================================\n")

        return {
            "reply": f"AI error: {type(e).__name__}: {str(e)}",
            "products": [],
            "cart": cart(user_id)
        }