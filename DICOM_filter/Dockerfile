FROM python:3.9.5

WORKDIR /dicom_filter

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . /dicom_filter

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y sqlite3 libsqlite3-dev

EXPOSE 5000
