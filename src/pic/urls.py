from django.conf.urls.defaults import patterns, url

from pic.settings import IMG_DIR

urlpatterns = patterns('',
    url(r'^$', 'gyazo.views.index', name='index'),
    url(r'^gyazo$', 'gyazo.views.gyazo', name='gyazo'),
    url(r'^login', 'django.contrib.auth.views.login', name='login'),
    url(r'^logout$', 'gyazo.views.logout', name='logout'),
    url(r'^admin$', 'gyazo.views.admin', name='admin'),
    url(r'^delete$', 'gyazo.views.delete', name='delete'),
    url(r'^edit$', 'gyazo.views.edit', name='edit'),
    url(r'^post$', 'gyazo.views.urlpost', name='urlpost'),
    (r'^(?P<path>.*)$', 'django.views.static.serve',{'document_root': IMG_DIR},),
)
