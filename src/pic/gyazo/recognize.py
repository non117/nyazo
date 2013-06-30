# -*- coding: utf-8 -*-
import mimetypes
import os
import time
import urllib

import Image
import requests

from pic.settings import API_KEY

api_key = API_KEY
api_region_url = "https://recognize.jp/v1/scenery/api/line-region"
api_line_url = "https://line.recognize.jp/v1/line/api/recognition/words"
    
def throw(api_url, api_key, image_path="", image_url="", api_format="json", **kwargs):
    ''' 文字認識APIにいろいろ投げる. JSONレスポンスを返す. '''
    params = {
              "characters":"english+japanese",
              "api-key": api_key,
              "api-format":api_format,
              }
    params.update(kwargs)
    if image_path: # POST
        url = "%s?%s" % (api_url, urllib.urlencode(params))
        headers = {'Content-Type':mimetypes.guess_type(image_path)[0]}
        response_json = requests.post(url, data=open(image_path, 'rb').read(), headers=headers)
    elif image_url: # GET
        params["image-url"] = image_url
        response_json = requests.get(api_url, params=params)
    return response_json.json()

def crop(json_data, img, file_prefix):
    ''' 文字領域の画像をcropする. [0-n].png で保存し, nを返す. '''
    i = -1
    if not json_data.has_key("lines"): #linesが無い場合
        return i
    
    areas = [map(dict.values, area["shape"]["point"]) for area in json_data["lines"].get("line", [])]
    for i, coords in enumerate(areas):
        box = (
            min(map(int, zip(*coords)[0])) - 5,
            min(map(int, zip(*coords)[1])) - 5,
            max(map(int, zip(*coords)[0])) + 5,
            max(map(int, zip(*coords)[1])) + 5,
            )
        if (box[2] - box[0]) < 1 or (box[3] - box[1]) < 1:
            continue
        img.crop(box).save(file_prefix + str(i) + ".png")
    return len(areas)

def get_words(json_data):
    ''' 一行文字認識のJSONレスポンスをパース, 文字にして返す. '''
    if json_data.has_key("words"):
        words = [word["@text"] for word in json_data["words"].get("word", [])]
        if words:
            return words[0]
    return []

def recognize(image_url="", image_path=""):
    temp_file_name = image_path or "temp" + os.path.splitext(image_url)[1]
    
    if os.path.splitext(temp_file_name)[-1] == ".gif":
        return ""
    
    if image_url:
        r = requests.get(image_url)
        with open(temp_file_name, "wb") as f:
            for chunk in r.iter_content(1024):
                f.write(chunk)
    result_json = throw(api_region_url, api_key, image_path=image_path, image_url=image_url)
    img = Image.open(temp_file_name)
    file_prefix = str(time.time())
    n = crop(result_json, img, file_prefix)
    if n == -1: # 文字領域が存在しない場合
        return ""
    words = []
    for i in range(n):
        image_path = file_prefix + str(i) + ".png"
        result_json = throw(api_line_url, api_key, image_path=image_path)
        word = get_words(result_json)
        if len(word) > 1:
            words.append(word)
        os.remove(image_path)
    return " ".join(words)
