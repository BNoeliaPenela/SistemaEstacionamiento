from django.urls import path
from .viewsBackup.exportView import ExportBackupView
from .viewsBackup.importView import ImportBackupView

urlpatterns = [

    path('export/', ExportBackupView.as_view()),
    path('import/', ImportBackupView.as_view()),
    
]