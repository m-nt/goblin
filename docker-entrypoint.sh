# docker-entrypoint.sh:
#!/usr/bin/env bash

# verify the docker.sock is present in the container
# if this fails it's because the socket wasn't mounted
if [[ ! -S /var/run/docker.sock ]]; then
    echo "docker socket is missing"
	exit 1
fi

# verify the docker.sock has read and write permissions enabled
if [[ ! -r /var/run/docker.sock || ! -w /var/run/docker.sock ]]
then
    echo "docker socket is missing read/write permission"
	exit 1
fi

# get the group id of the docker socket
# this is inherited from the host machine
gid=$(stat -c '%g' '/var/run/docker.sock')

# lookup the group by id within the container
# if it's missing, swallow the error and create the group
# using the inherited socket group id called 'docker'
if ! getent group "$gid" >/dev/null; then
	addgroup --gid "$gid" docker
fi

# get the name of the group by group id.
# this doesn't necessarily have to be called 'docker'
# it could have different names on both the host machine
# and container due to system differences or group id collisions
gname=$(getent group "$gid" | cut -d: -f1)

# check if the group name is in the list of groups that
# 'myuser' has membership too. If not, add them.
if ! groups myuser | grep --quiet "\b${gname}\b"; then
	usermod --append --groups "$gid" myuser
fi

# finally switch to our user and use the legacy buildkit.
# it's important to use the legacy buildkit because of version
# mismatching running on Docker for Desktop and a minimal linux
# installation.
sudo -u myuser DOCKER_BUILDKIT=0 "$@"