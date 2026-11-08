from rest_framework import generics, mixins, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Invoice, Profile
from .permissions import IsOwner
from .serializers import InvoiceSerializer, ProfileSerializer, SignupSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    # ruleid: drf-anonymous-write-endpoint
    permission_classes = [AllowAny]


class ProfileDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    # ruleid: drf-anonymous-write-endpoint
    permission_classes = []


class ProfileUpdate(mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = ProfileSerializer
    # ruleid: drf-anonymous-write-endpoint
    permission_classes = (permissions.AllowAny,)


# ruleid: drf-anonymous-write-endpoint
@api_view(["GET", "DELETE"])
@permission_classes([AllowAny])
def delete_invoice(request, pk):
    Invoice.objects.filter(pk=pk).delete()
    return Response(status=204)


class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    # ok: drf-anonymous-write-endpoint
    permission_classes = [AllowAny]


class PublicInvoices(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.filter(public=True)
    serializer_class = InvoiceSerializer
    # ok: drf-anonymous-write-endpoint
    permission_classes = [AllowAny]


class OwnedInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    # ok: drf-anonymous-write-endpoint
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Invoice.objects.filter(owner=self.request.user)


class MixedInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    # ok: drf-anonymous-write-endpoint
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated(), IsOwner()]


# ok: drf-anonymous-write-endpoint
@api_view(["GET"])
@permission_classes([AllowAny])
def invoice_count(request):
    return Response({"count": Invoice.objects.filter(public=True).count()})


# ruleid: drf-anonymous-write-endpoint
@api_view(["PATCH"])
@permission_classes([])
def rename_profile(request, pk):
    Profile.objects.filter(pk=pk).update(name=request.data["name"])
    return Response(status=204)


class InvoiceBrowser(viewsets.ModelViewSet):
    queryset = Invoice.objects.filter(public=True)
    serializer_class = InvoiceSerializer
    http_method_names = ["get", "head", "options"]
    # ok: drf-anonymous-write-endpoint
    permission_classes = [AllowAny]
