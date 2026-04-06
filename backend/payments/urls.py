from django.urls import path
from .views import CrearPagoView, PagosListView, ReversarPagoView, ValidarPagoView

urlpatterns = [
    path("", PagosListView.as_view()),
    path("create/", CrearPagoView.as_view()),
    path('<int:pk>/reversar/', ReversarPagoView.as_view()),
    path('validate/', ValidarPagoView.as_view())
]