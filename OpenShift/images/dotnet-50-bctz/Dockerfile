# OpenShift overrides FROM with the tools project's dotnet-50:latest
# ImageStreamTag configured in build-template.yaml.
FROM image-registry.openshift-image-registry.svc:5000/47ba99-tools/dotnet-50:latest

USER 0

RUN yum update -y tzdata \
    && rpm -q tzdata \
    && TZ=America/Vancouver date -d '2026-11-02 12:00:00 UTC' '+%F %T %z' \
    && test "$(TZ=America/Vancouver date -d '2026-11-02 12:00:00 UTC' '+%z')" = "-0700" \
    && yum clean all

USER 1001
