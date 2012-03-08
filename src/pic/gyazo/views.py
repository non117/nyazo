# -*- coding: utf-8 -*-
import hashlib
import os
import urllib, urllib2
import Image as Image_
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.simple import direct_to_template

from pic.gyazo.models import Image, Tag
from pic.settings import IMG_DIR, HOST, SALT


try:
    prev_name = Image.objects.latest("created").filename
except ObjectDoesNotExist:
    prev_name = "XXX"

def index(request):
    cache.get("image_list")
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
    all_tags = Tag.objects.all().values_list("name", flat=True)
    if request.method == "POST":
        image_list = request.FILES.getlist("imagedata")
        tags = filter(lambda s:s!="", request.POST["tags"].split(","))
        new_tags = list(set(tags) - (set(tags) & set(all_tags)))
        for tag_name in new_tags:
            Tag.objects.create(name=tag_name)
        tags = Tag.objects.filter(name__in=tags)
        description = request.POST["description"]
        for image in image_list:
            image_type = image.name.split(".")[-1]
            image_name = "%s.%s" % (gen_next_name(), image_type)
            image_data = image.read()
            save_image(image_name, image_data, tags, description or image.name)
        return HttpResponseRedirect(reverse("admin"))
    else:
        keyword = request.GET.get("keyword","")
        if request.GET.get("tags"):
            tags = Tag.objects.filter(name__in=filter(lambda s:s!="",request.GET["tags"].split(",")))
            image_list = Image.objects.filter(description__contains=keyword, tag__in=tags).order_by("-created").distinct()
        else:
            image_list = Image.objects.filter(description__contains=keyword).order_by("-created").distinct()
        
        paginator = Paginator(image_list, 35)
        page = request.GET.get('page', '1')
        try:
            contacts = paginator.page(page)
            nextpage = int(page) + 1
        except (EmptyPage, PageNotAnInteger):
            contacts = []
            nextpage = ""
        get_q = dict(request.GET.items())
        get_q["page"] = nextpage
        for key, val in get_q.items():
            if isinstance(val, unicode): get_q[key] = val.encode("utf-8")
        nextparams = urllib.urlencode(get_q)
        number = u"%d件" % len(image_list)
        return direct_to_template(request, "admin.html", {"contacts":contacts,
                                                          "number":number,
                                                          "nextparams":nextparams,
                                                          "tags":all_tags
                                                          })

def logout(request):
    auth_logout(request)
    return HttpResponseRedirect(reverse("index"))

def gen_next_name():
    ''' ランダムっぽく見える名前を生成する. '''
    # 桁数
    base = 3
    # 62進数の変換表
    n_map = {0:'X',1:'E',2:'k',3:'l',4:'O',5:'o',6:'t',7:'c',8:'J',9:'V',
             10:'Y',11:'0',12:'4',13:'s',14:'2',15:'m',16:'T',17:'D',18:'8',19:'g',
             20:'p',21:'n',22:'W',23:'w',24:'9',25:'7',26:'z',27:'a',28:'5',29:'G',
             30:'h',31:'F',32:'M',33:'L',34:'S',35:'N',36:'j',37:'b',38:'y',39:'Z',
             40:'r',41:'U',42:'x',43:'q',44:'v',45:'H',46:'d',47:'P',48:'f',49:'u',
             50:'I',51:'3',52:'6',53:'R',54:'Q',55:'C',56:'i',57:'e',58:'K',59:'B',60:'1',61:'A'}
    global prev_name
    prev_name = prev_name.split(".")[0].replace("/","")
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
    return os.path.join(prev_name[0], prev_name[1:])

@csrf_exempt
def urlpost(request):
    if request.method == "POST":
        url = request.POST.get("url", "").split("?")[0]
        hash = request.POST.get("hash", "")
        tag = request.POST.get("tag", "web")
        server_hash = hashlib.sha1(url+SALT).hexdigest()
        if hash == server_hash:
            image_type = url.split(".")[-1]
            image_name = "%s.%s" % (gen_next_name(), image_type)
            req = urllib2.Request(url)
            if "pixiv.net" in url:
                req.add_header("Referer","http://www.pixiv.net")
            image_data = urllib2.urlopen(req).read()
            tag,_ = Tag.objects.get_or_create(name=tag)
            save_image(image_name, image_data, [tag], url, url)
            return HttpResponse("success")
        return HttpResponse("hash not match")

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
        tag,_ = Tag.objects.get_or_create(name="Gyazo")
        if hash == server_hash:
            url = save_image(image_name, image_data, [tag])
            return HttpResponse(url)
    return HttpResponse()
    
def save_image(image_name, image_data, tags, description="", permlink="", meta=""):
    image_path = os.path.join(IMG_DIR, image_name)
    thumbnail_path = os.path.join(IMG_DIR, "thumbnail", image_name)
    if not os.path.exists(os.path.dirname(image_path)):
        os.mkdir(os.path.dirname(image_path))
    if not os.path.exists(os.path.dirname(thumbnail_path)):
        os.mkdir(os.path.dirname(thumbnail_path))
    image_url = os.path.join(HOST, image_name)
    with open(image_path, 'w') as f:
        f.write(image_data)
    thumb = Image_.open(image_path)
    thumb.thumbnail((250,250))
    thumb.save(thumbnail_path)
    # DBに保存
    image_obj = Image(filename=image_name, description=description,
                      permlink=permlink, meta=meta)
    image_obj.save()
    image_obj.tag = tags
    image_obj.save()
    return image_url

@csrf_exempt
@login_required
def edit(request):
    if request.method == "POST":
        id = int(request.POST["id"])
        description = request.POST.get("description", "")
        tags = filter(lambda s:s!="", request.POST["tags"].split(","))
        image = Image.objects.get(id=id)
        if description:
            image.description = description
        if tags:
            tags = map(lambda name: Tag.objects.get_or_create(name=name)[0],tags)
            image.tag = tags
        image.save()
        return HttpResponse("saved")

@login_required
def delete(request):
    if request.GET.get("name"):
        name = "/".join(request.GET["name"].split("/")[-2:])
        try:
            image = Image.objects.get(filename=name)
        except ObjectDoesNotExist:
            return HttpResponse()
        image.delete()
        image_path = os.path.join(IMG_DIR, name)
        os.remove(image_path)
    return HttpResponse()