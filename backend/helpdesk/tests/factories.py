import factory
from django.contrib.auth.hashers import make_password

from helpdesk.choices import Role
from helpdesk.models import ClientOrganization, Department, IssueCategory, User


class DepartmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Department
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"Department {n}")


class ClientOrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ClientOrganization

    name = factory.Sequence(lambda n: f"Organization {n}")
    site_label = factory.LazyAttribute(lambda org: f"{org.name}-0001; 1F")


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    # Demo users never log in; an unusable password also avoids slow hashing in tests.
    password = factory.LazyFunction(lambda: make_password(None))


class ClientFactory(UserFactory):
    role = Role.CLIENT
    designation = "Client POC"
    organization = factory.SubFactory(ClientOrganizationFactory)


class PocFactory(UserFactory):
    role = Role.POC
    designation = "Manager"
    department = factory.SubFactory(DepartmentFactory)


class TechnicianFactory(UserFactory):
    role = Role.TECHNICIAN
    designation = "Technician"
    department = factory.SubFactory(DepartmentFactory)


class IssueCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = IssueCategory

    name = factory.Sequence(lambda n: f"Issue {n}")
    department = factory.SubFactory(DepartmentFactory)
