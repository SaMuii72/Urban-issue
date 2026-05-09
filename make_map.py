import pandas as pd
import folium
from folium.plugins import HeatMap, MarkerCluster

df = pd.read_csv("events.csv")

# สีตามประเภท
COLOR_MAP = {
    "fire":       "red",
    "storm":      "purple",
    "flood":      "blue",
    "earthquake": "orange",
    "landslide":  "darkred",
    "volcano":    "black",
    "ไฟฟ้า":      "orange",
    "ต้นไม้":     "green",
    "น้ำท่วม":    "blue",
    "ทางเท้า":    "gray",
    "ถนน":        "lightgray",
    "อุบัติเหตุ": "red",
    "ขยะ":        "darkgreen",
}

# สร้างแผนที่ center ที่โลก
m = folium.Map(location=[20, 0], zoom_start=3)

# Layer 1: Marker Cluster (คลิกดูรายละเอียดได้)
cluster = MarkerCluster(name="เหตุการณ์ทั้งหมด").add_to(m)

for _, row in df.iterrows():
    color = COLOR_MAP.get(row["category"], "gray")
    
    popup_html = f"""
    <b>{row['title']}</b><br>
    ประเภท: {row['category']}<br>
    ระดับ: {row['severity']}<br>
    ประเทศ: {row['country'] or 'N/A'}<br>
    วันที่: {row['date']}<br>
    แหล่งข้อมูล: {row['source']}<br>
    """
    if pd.notna(row.get("image_url")) and row["image_url"]:
        popup_html += f'<img src="{row["image_url"]}" width="200"><br>'
    if pd.notna(row.get("source_url")) and row["source_url"]:
        popup_html += f'<a href="{row["source_url"]}" target="_blank">ดูเพิ่มเติม</a>'

    folium.CircleMarker(
        location=[row["lat"], row["lng"]],
        radius=8,
        color=color,
        fill=True,
        fill_opacity=0.7,
        popup=folium.Popup(popup_html, max_width=250),
        tooltip=row["title"],
    ).add_to(cluster)

# Layer 2: Heatmap
heat_data = df[["lat", "lng"]].dropna().values.tolist()
HeatMap(heat_data, name="Heatmap ความหนาแน่น", radius=20).add_to(m)

# Layer control (toggle ระหว่าง marker กับ heatmap)
folium.LayerControl().add_to(m)

m.save("map.html")
print("บันทึกแผนที่ลง map.html แล้ว")
print(f"แสดง {len(df)} จุดบนแผนที่")