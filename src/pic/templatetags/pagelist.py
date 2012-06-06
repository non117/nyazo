# -*- coding: utf-8 -*-
from django import template

register = template.Library()

@register.filter
def pagelist(lis, current):
    temp_lis = range(current-10, current) + [current] + range(current+1, current+11)
    return filter(lambda n:n in lis, temp_lis)