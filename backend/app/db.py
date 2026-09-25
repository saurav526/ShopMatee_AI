import os, json
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()
DB_URL=os.getenv('DATABASE_URL','postgresql://postgres:postgres@localhost:5432/shopmate')

PRODUCTS=[
(1,'Alpine Waterproof Jacket','Jackets',89.99,4.7,18,'Lightweight waterproof hiking jacket for rain, wind and mountain trails.',['waterproof','windproof','lightweight','hiking','breathable']),
(2,'StormShield Hiking Shell','Jackets',129.99,4.8,11,'Premium three-layer shell for heavy rain and demanding outdoor trips.',['waterproof','heavy rain','breathable','hiking','3-layer']),
(3,'Urban Rain Parka','Jackets',74.99,4.3,24,'Comfortable everyday rain parka with a clean urban fit.',['water resistant','casual','hooded','lightweight']),
(4,'TrailRunner Pro','Running Shoes',109.99,4.8,21,'Responsive running shoe with durable outsole and strong trail grip.',['running','trail','cushioning','grip','lightweight']),
(5,'CloudStep Daily Runner','Running Shoes',84.99,4.6,30,'Daily trainer focused on comfort for walking and running.',['running','walking','cushioning','daily','lightweight']),
(6,'Mountain Trek Boots','Footwear',149.99,4.9,9,'High-traction hiking boots for rocky terrain and long treks.',['hiking','boots','waterproof','grip','durable']),
(7,'HydroTrail Backpack 28L','Backpacks',69.99,4.5,17,'Weather-resistant hiking backpack with ventilated back panel.',['hiking','water resistant','28L','ventilated','travel']),
(8,'Summit Trek Poles','Outdoor Gear',39.99,4.4,25,'Adjustable trekking poles with ergonomic grips.',['hiking','adjustable','lightweight','trekking']),
(9,'AeroFit Smartwatch','Wearables',179.99,4.6,14,'Fitness smartwatch with GPS, heart-rate tracking and activity modes.',['GPS','fitness','running','water resistant']),
(10,'ThermoPeak Bottle 750ml','Outdoor Gear',24.99,4.7,40,'Insulated stainless-steel bottle for hikes, gym and travel.',['insulated','stainless steel','750ml','travel']),
(11,'BreezeLite Fleece','Clothing',54.99,4.5,26,'Warm lightweight fleece layer for cool-weather adventures.',['fleece','warm','lightweight','hiking']),
(12,'PeakTrail Sunglasses','Accessories',44.99,4.4,32,'Polarized outdoor sunglasses with UV protection.',['polarized','UV protection','hiking','outdoor'])]

def conn(): return psycopg.connect(DB_URL,row_factory=dict_row)

def init_db():
    with conn() as c:
        c.execute('CREATE EXTENSION IF NOT EXISTS vector')
        c.execute('''CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now())''')
        c.execute('''CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,name TEXT,category TEXT,price NUMERIC(10,2),rating REAL,stock INTEGER,description TEXT,features JSONB,embedding vector(384))''')
        c.execute('''CREATE TABLE IF NOT EXISTS cart_items(user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,product_id INTEGER REFERENCES products(id),quantity INTEGER NOT NULL,PRIMARY KEY(user_id,product_id))''')
        c.execute('''CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),status TEXT,total NUMERIC(10,2),items JSONB,billing JSONB,created_at TIMESTAMPTZ DEFAULT now())''')
        c.execute('''ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing JSONB''')
        c.execute('''CREATE TABLE IF NOT EXISTS events(id BIGSERIAL PRIMARY KEY,user_id INTEGER,kind TEXT,product_id INTEGER,metadata JSONB,created_at TIMESTAMPTZ DEFAULT now())''')
        for p in PRODUCTS:
            c.execute('''INSERT INTO products(id,name,category,price,rating,stock,description,features) VALUES(%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING''',(p[0],p[1],p[2],p[3],p[4],p[5],p[6],json.dumps(p[7])))

def get_products():
    with conn() as c: return c.execute('SELECT id,name,category,price,rating,stock,description,features FROM products ORDER BY rating DESC,price').fetchall()

def get_product(pid):
    with conn() as c: return c.execute('SELECT id,name,category,price,rating,stock,description,features FROM products WHERE id=%s',(pid,)).fetchone()

def set_embedding(pid, vec):
    with conn() as c: c.execute('UPDATE products SET embedding=%s::vector WHERE id=%s',(str(vec.tolist()),pid))

def search_vector(vec, limit=8):
    with conn() as c:
        return c.execute('''SELECT id,name,category,price,rating,stock,description,features,1-(embedding <=> %s::vector) AS similarity FROM products WHERE embedding IS NOT NULL ORDER BY embedding <=> %s::vector LIMIT %s''',(str(vec.tolist()),str(vec.tolist()),limit)).fetchall()

def search_keyword(q,max_price=None,min_rating=None,category=None):
    params=[]; where=[]
    if q:
        params.append('%'+q.lower()+'%'); where.append("lower(name||' '||category||' '||description||' '||features::text) LIKE %s")
    if max_price is not None: params.append(max_price); where.append('price<=%s')
    if min_rating is not None: params.append(min_rating); where.append('rating>=%s')
    if category: params.append('%'+category.lower()+'%'); where.append('lower(category) LIKE %s')
    w=('WHERE '+' AND '.join(where)) if where else ''
    with conn() as c: return c.execute(f'SELECT id,name,category,price,rating,stock,description,features FROM products {w} ORDER BY rating DESC,price LIMIT 12',params).fetchall()

def user_by_email(email):
    with conn() as c: return c.execute('SELECT * FROM users WHERE email=%s',(email.lower(),)).fetchone()

def create_user(email,pwh):
    with conn() as c: return c.execute('INSERT INTO users(email,password_hash) VALUES(%s,%s) RETURNING id,email',(email.lower(),pwh)).fetchone()

def cart(user_id):
    with conn() as c:
        rows=c.execute('''SELECT p.id,p.name,p.category,p.price,p.rating,p.stock,p.description,p.features,c.quantity,(p.price*c.quantity) line_total FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=%s''',(user_id,)).fetchall()
    return {'items':rows,'total':round(sum(float(r['line_total']) for r in rows),2)}

def add_cart(user_id,pid,qty=1):
    with conn() as c:
        c.execute('''INSERT INTO cart_items(user_id,product_id,quantity) VALUES(%s,%s,%s) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=cart_items.quantity+EXCLUDED.quantity''',(user_id,pid,qty))
        c.execute('INSERT INTO events(user_id,kind,product_id) VALUES(%s,%s,%s)',(user_id,'add_to_cart',pid))
    return cart(user_id)

def clear_cart(user_id):
    with conn() as c: c.execute('DELETE FROM cart_items WHERE user_id=%s',(user_id,))

def order(user_id,billing=None):
    current=cart(user_id)
    if not current['items']: raise ValueError('Cart is empty')
    import uuid
    oid='ORD-'+uuid.uuid4().hex[:8].upper()
    items=[dict(x) for x in current['items']]
    with conn() as c:
        c.execute('INSERT INTO orders(id,user_id,status,total,items,billing) VALUES(%s,%s,%s,%s,%s,%s)',(oid,user_id,'CONFIRMED',current['total'],json.dumps(items,default=str),json.dumps(billing) if billing else None))
        c.execute('INSERT INTO events(user_id,kind,metadata) VALUES(%s,%s,%s)',(user_id,'order_placed',json.dumps({'order_id':oid,'total':current['total']})))
    clear_cart(user_id); return {'order_id':oid,'status':'CONFIRMED','total':current['total'],'items':items,'billing':billing}

def list_orders(user_id):
    with conn() as c:
        rows=c.execute('SELECT id,status,total,items,billing,created_at FROM orders WHERE user_id=%s ORDER BY created_at DESC',(user_id,)).fetchall()
    return rows

def analytics():
    with conn() as c:
        users=c.execute('SELECT count(*) n FROM users').fetchone()['n']; orders=c.execute("SELECT count(*) n FROM orders").fetchone()['n']; revenue=c.execute("SELECT COALESCE(sum(total),0) x FROM orders").fetchone()['x']; top=c.execute('''SELECT p.name,count(*) n FROM events e JOIN products p ON p.id=e.product_id WHERE e.kind='add_to_cart' GROUP BY p.name ORDER BY n DESC LIMIT 5''').fetchall()
    return {'users':users,'orders':orders,'revenue':float(revenue),'top_products':top}
