from django.urls import path

from clients.views.pdfView import ClientePDFView
from .views.views import ClientCreateView, ClienteDetailView, ClientesListView

urlpatterns = [
    path('create/', ClientCreateView.as_view()),
    path("", ClientesListView.as_view()),
    path("<int:pk>/", ClienteDetailView.as_view()),
    path("<int:pk>/pdf/", ClientePDFView.as_view()),
]