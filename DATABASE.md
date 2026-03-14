# Database Schema

## Users

Fields

* id
* email
* name
* password_hash
* created_at

## Documents

Fields

* id
* user_id
* file_url
* expiry_time
* status
* created_at

Status Values

* uploaded
* printed
* expired

## Shops

Fields

* id
* name
* location
* owner_email
* created_at

## PrintJobs

Fields

* id
* document_id
* shop_id
* pages
* copies
* color_mode
* status
* created_at

Status Values

* pending
* printing
* completed
* failed
