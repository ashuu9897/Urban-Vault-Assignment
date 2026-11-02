from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import IssueCategoryListView, MeView, TicketViewSet, UserListView

router = SimpleRouter()
router.register("tickets", TicketViewSet, basename="ticket")

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
    path("me/", MeView.as_view(), name="me"),
    path("issue-categories/", IssueCategoryListView.as_view(), name="issue-category-list"),
    *router.urls,
]
