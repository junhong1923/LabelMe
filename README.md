# ShareLabel
* A **label-shared platform** for machine & deep learning users.  
* Users can upload images and **obtain labels** either by themselves or labels shared from others.  
* The idea of this project aims to **save time and labor cost** for someone who would like to annotate images. 

***Suggestion**: Image size within 900 * 700 would be better*

**Website URL**: https://sharelabel.site

**Test Account**:
* name: test
* email: test@gmail.con
* password: test

## Table of Contents
* [Technologies](#Technologies)
* [Architecture](#Architecture)
* [Database Schema](#Database-Schema)
* [Features](#Features)
* [Demonstration](#Demonstration)
* [Contact](#Contact)

## Technologies
### Back-End
* Linux
* Node.js / Express
* RESTful API
* Nginx

### Front-End
* HTML / CSS
* JavaScript
* Bootstrap
* AJAX

### Database
* MySQL

### Cloud Services
* Amazon Elastic Compute Cloud (EC2)
* Amazon Relational Database Service (RDS)
* Amazon Simple Storage Service (S3)
* Amazon CloudFront
* Google Cloud Vision API

### Networking
* HTTP & HTTPS
* Domain Name System (DNS)

### Test
* Mocha
* Chai

### Others
* Design Pattern: MVC
* Version Control: Git, Github
* Docker

## Architecture
![architecture](https://label-me.s3.ap-northeast-1.amazonaws.com/github-readme-images/architecture.png)
## Database Schema
![DB schema](https://d1h417jtpfjyq.cloudfront.net/github-readme-images/label.png)
## Features
### Label tools
* Provided **bounding box** - generally used in object detection task
* Included undo, redo, zoom-in, and zoom-out functions.
* Labels can be created, modified, and deleted.

### Automatically AI predicted labels
* Integrated [Google Vision API](https://cloud.google.com/vision?hl=zh_tw) for predicted labels.
* Render AI inferenced labels within about 15 seconds when image was uploaded.
* Users are able to **get labels easily** by just checking or simply modifying.

### Others
* Labels are visually distinct with **user-defined tags** in different colors.
* Labels are accessible by downloading JSON file.
* Each user is limited with 2GB uploaded capacity.

### To-do features
* More label tools such as polygon, segmentation.
* Better encouragement and reward mechanism, for instance, user label and share more, then rewarded with larger upload capacity.
* Upload images in batch.

## Demonstration
#### Get API labels
![api gif](https://label-me.s3.ap-northeast-1.amazonaws.com/github-readme-images/feature_upload.gif)

#### Modify labels
![modify gif](https://label-me.s3.ap-northeast-1.amazonaws.com/github-readme-images/feature_modify.gif)

## Contact
Jun Hong Lin  
Email: m81923@gmail.com
