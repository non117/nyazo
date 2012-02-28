# -*- coding: utf-8 -*-
import hashlib
import os
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.simple import direct_to_template

from pic.gyazo.models import Image, Tag
from pic.settings import IMG_DIR, IMG_URL, SALT


try:
    prev_name = Image.objects.latest("created").filename
except ObjectDoesNotExist:
    prev_name = "XXX"

def index(request):
    try:
        tag = Tag.objects.get(name="Gyazo")
    except ObjectDoesNotExist:
        tag = None
    image_list = Image.objects.filter(tag=tag).order_by("-created")
    paginator = Paginator(image_list, 35)
    page = request.GET.get('page', '1')
    try:
        contacts = paginator.page(page)
        nextpage = int(page) + 1
    except EmptyPage:
        contacts = paginator.page(paginator.num_pages)
        nextpage = ""
    return direct_to_template(request, "index.html", {"contacts":contacts, "nextpage":nextpage})

@login_required
def admin(request):
    if request.method == "POST":
        upload(request)
        return HttpResponseRedirect(reverse("admin"))
    else:
        image_list = Image.objects.all().order_by("-created")
        paginator = Paginator(image_list, 35)
        page = request.GET.get('page', '1')
        try:
            contacts = paginator.page(page)
            nextpage = int(page) + 1
        except EmptyPage:
            contacts = paginator.page(paginator.num_pages)
            nextpage = ""
        return direct_to_template(request, "admin.html", {"contacts":contacts, "nextpage":nextpage})

def logout(request):
    auth_logout(request)
    return HttpResponseRedirect(reverse("index"))

def gen_next_name():
    ''' ランダムっぽく見える名前を生成する. '''
    global prev_name
    # 桁数
    base = 3
    # 62進数の変換表
    n_map = {0:'X',1:'E',2:'k',3:'l',4:'O',5:'o',6:'t',7:'c',8:'J',9:'V',
             10:'Y',11:'0',12:'4',13:'s',14:'2',15:'m',16:'T',17:'D',18:'8',19:'g',
             20:'p',21:'n',22:'W',23:'w',24:'9',25:'7',26:'z',27:'a',28:'5',29:'G',
             30:'h',31:'F',32:'M',33:'L',34:'S',35:'N',36:'j',37:'b',38:'y',39:'Z',
             40:'r',41:'U',42:'x',43:'q',44:'v',45:'H',46:'d',47:'P',48:'f',49:'u',
             50:'I',51:'3',52:'6',53:'R',54:'Q',55:'C',56:'i',57:'e',58:'K',59:'B',60:'1',61:'A'}
    num = 0
    # 文字列から10進数に復号化
    for k,v in n_map.items():
        for i,s in enumerate(prev_name):
            if s == v:
                num += k*62**i
    # 適当に62^base乗と素な数を足す
    delta = 3*62**(base-1)+5*62**(base-2)+7
    new_num = num + delta
    # 10進数から文字列に暗号化
    lis = []
    for i in range(base):
        lis.append(n_map[new_num%62])
        new_num = new_num/62
    prev_name = ''.join(lis)
    return prev_name

@csrf_exempt
def gyazo(request):
    if request.method == "POST":
        hash = request.POST.get("hash", "")
        # 拡張子を特定
        image_type = request.FILES["imagedata"].name.split(".")[-1]
        image_name = "%s.%s" % (gen_next_name(), image_type)
        
        image_data = request.FILES["imagedata"].read()
        # 画像データとソルトでsha1ハッシュ値を計算
        server_hash = hashlib.sha1(image_data+SALT).hexdigest()
        if hash == server_hash:
            url = save_image(image_name, image_data, "Gyazo")
            return HttpResponse(url)
    return HttpResponse("")

def upload(request):
    tag = request.POST.get("tag", "web")
    image_list = request.FILES.getlist("imagedata")
    for image in image_list:
        image_type = image.name.split(".")[-1]
        image_name = "%s.%s" % (gen_next_name(), image_type)
        image_data = image.read()
        save_image(image_name, image_data, tag)
    
def save_image(image_name, image_data, tag):
    image_path = os.path.join(IMG_DIR, image_name)
    image_url = os.path.join(IMG_URL, image_name)
    with open(image_path, 'w') as f:
        f.write(image_data)
    # DBに保存
    tag,_ = Tag.objects.get_or_create(name=tag)
    image_obj = Image(filename=image_name)
    image_obj.save()
    image_obj.tag = [tag]
    image_obj.save()
    return image_url