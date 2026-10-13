# OpenShift overrides FROM with the existing dotnet-50:latest ImageStreamTag
# configured in build-template.yaml. This digest is the local-build fallback.
FROM registry.redhat.io/rhel8/dotnet-50@sha256:23f50b511b8cc0ef9b4dde4baeddde0cb677ab36650eb0feda56fb39ecabc8c6

USER 0

RUN yum update -y tzdata \
    && rpm -q tzdata \
    && TZ=America/Vancouver date -d '2026-11-02 12:00:00 UTC' '+%F %T %z' \
    && test "$(TZ=America/Vancouver date -d '2026-11-02 12:00:00 UTC' '+%z')" = "-0700" \
    && yum clean all

USER 1001
