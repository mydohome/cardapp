FROM alpine:3.20

RUN apk add --no-cache postgresql16-client tar gzip dcron bash

COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh

COPY crontab /etc/crontabs/root

CMD ["crond", "-f", "-l", "2"]
