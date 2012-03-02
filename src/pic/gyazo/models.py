# -*- coding: utf-8 -*-
from django.db import models

class Tag(models.Model):
    def __unicode__(self):
        return self.name
    name = models.CharField(u"タグ名", max_length=100)
    
class Image(models.Model):
    def __unicode(self):
        return self.filename
    filename = models.CharField(u"ファイル名", max_length=200)
    tag = models.ManyToManyField(Tag)
    description = models.CharField(u"詳細", max_length=200)
    permlink = models.CharField(u"パーマリンク", max_length=200)
    meta = models.CharField(u"メタ情報", max_length=1000)
    created = models.DateTimeField(u"作成日", auto_now_add=True)
