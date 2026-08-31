# API URLs

## Base URL

```text
http://localhost:3000/api/v1
```

---

# 1. Authentication APIs

Base URL:

```text
http://localhost:3000/api/v1/auth
```

### Signup

**POST**

```text
POST /auth/singup
```

Full URL:

```text
http://localhost:3000/api/v1/auth/singup
```

Purpose:

Create a new user account.

---

### Login

**POST**

```text
POST /auth/login
```

Full URL:

```text
http://localhost:3000/api/v1/auth/login
```

Purpose:

Login user and get authentication token.

---

### Forgot Password

**POST**

```text
POST /auth/forgotPassword
```

Full URL:

```text
http://localhost:3000/api/v1/auth/forgotPassword
```

Purpose:

Request a password reset.

---

### Reset Password

**PATCH**

```text
PATCH /auth/resetPassword/:token
```

Example:

```text
http://localhost:3000/api/v1/auth/resetPassword/abc123
```

Purpose:

Reset password using the reset token.

---

### Update Password

**PATCH**

```text
PATCH /auth/updatePassword
```

Full URL:

```text
http://localhost:3000/api/v1/auth/updatePassword
```

Middleware:

```text
protect
```

Purpose:

Update the password of the currently logged-in user.

---

# 2. User APIs

Base URL:

```text
http://localhost:3000/api/v1/users
```

---

### Get All Users

**GET**

```text
GET /users
```

Full URL:

```text
http://localhost:3000/api/v1/users
```

Purpose:

Get all users.

---

### Get Current User

**GET**

```text
GET /users
```

Full URL:

```text
http://localhost:3000/api/v1/users
```

Middleware:

```text
protect
```

Purpose:

Get the currently logged-in user's information.

> Note: Your current router uses the same `/` path for `getAllUser` and `getSpecificUser`. Because both are registered as GET `/`, you should review this route if you intend to have separate endpoints for "all users" and "current user".

---

### Update Current User

**PATCH**

```text
PATCH /users
```

Full URL:

```text
http://localhost:3000/api/v1/users
```

Middleware:

```text
protect
```

Purpose:

Update the currently logged-in user's information.

---

### Delete Current User

**DELETE**

```text
DELETE /users
```

Full URL:

```text
http://localhost:3000/api/v1/users
```

Middleware:

```text
protect
```

Purpose:

Delete/deactivate the currently logged-in user.

---

### Activate User

**POST**

```text
POST /users/activeUser
```

Full URL:

```text
http://localhost:3000/api/v1/users/activeUser
```

Purpose:

Activate a user.

---

# 3. Tour APIs

Base URL:

```text
http://localhost:3000/api/v1/tours
```

---

### Get All Tours

**GET**

```text
GET /tours
```

Full URL:

```text
http://localhost:3000/api/v1/tours
```

Middleware:

```text
protect
```

Purpose:

Get all tours.

---

### Add Tour

**POST**

```text
POST /tours
```

Full URL:

```text
http://localhost:3000/api/v1/tours
```

Middleware:

```text
protect
restrictTour("admin")
```

Purpose:

Create a new tour.

Only an **admin** can create a tour.

---

### Get Specific Tour

**GET**

```text
GET /tours/:id
```

Example:

```text
http://localhost:3000/api/v1/tours/5c88fa8cf4afda39709c2960
```

Purpose:

Get one specific tour.

---

### Update Tour

**PATCH**

```text
PATCH /tours/:id
```

Example:

```text
http://localhost:3000/api/v1/tours/5c88fa8cf4afda39709c2960
```

Middleware:

```text
protect
restrictTour("admin")
```

Purpose:

Update a tour.

Only an **admin** can update a tour.

---

### Delete Tour

**DELETE**

```text
DELETE /tours/:id
```

Example:

```text
http://localhost:3000/api/v1/tours/5c88fa8cf4afda39709c2960
```

Middleware:

```text
protect
restrictTour("admin")
```

Purpose:

Delete a tour.

Only an **admin** can delete a tour.

---

### Top 5 Cheapest Tours

**GET**

```text
GET /tours/getTop5CheapestPlace
```

Full URL:

```text
http://localhost:3000/api/v1/tours/getTop5CheapestPlace
```

Middleware:

```text
getTop5CheapestPlace
```

Purpose:

Get the 5 cheapest tours.

Your middleware sets:

```text
limit = 5
sort = price
fields = name, price, difficulty, ratingsAverage
```

---

### Tour Statistics

**GET**

```text
GET /tours/getToursStats
```

Full URL:

```text
http://localhost:3000/api/v1/tours/getToursStats
```

Purpose:

Get statistics about tours.

---

### Monthly Plan

**GET**

```text
GET /tours/getMonthlyPlan/:year
```

Example:

```text
http://localhost:3000/api/v1/tours/getMonthlyPlan/2026
```

Purpose:

Get the monthly tour plan for a particular year.

---

# 4. Review APIs

Base URL:

```text
http://localhost:3000/api/v1/review
```

---

### Add Review

**POST**

```text
POST /review/addReviews
```

Full URL:

```text
http://localhost:3000/api/v1/review/addReviews
```

Middleware:

```text
protect
```

Purpose:

Add a review.

---

### Show Reviews

**GET**

```text
GET /review/showReview
```

Full URL:

```text
http://localhost:3000/api/v1/review/showReview
```

Middleware:

```text
protect
```

Purpose:

Show reviews.

---

# 5. Nested Review Route

You also have this route inside your **tour router**:

```text
POST /tours/:tourID
```

with:

```text
protect
restrictTour("user")
addReviews
```

However, according to your comment:

```text
POST /tour/:id/review
```

the route should ideally be:

```text
POST /tours/:tourID/review
```

So your router could be:

```js
router
  .route("/:tourID/review")
  .post(
    authController.protect,
    authController.restrictTour("user"),
    reviewController.addReviews
  );
```

Then the full URL becomes:

```text
POST http://localhost:3000/api/v1/tours/:tourID/review
```

Example:

```text
POST http://localhost:3000/api/v1/tours/5c88fa8cf4afda39709c2960/review
```

This is a more understandable REST-style URL because the review belongs to a specific tour.

---

# 6. Query Examples — Tours

## Filtering

### Difficulty

```text
GET /tours?difficulty=easy
```

Full URL:

```text
http://localhost:3000/api/v1/tours?difficulty=easy
```

Meaning:

```text
Find tours where difficulty = easy
```

---

### Duration greater than 5

```text
GET /tours?duration[gt]=5
```

Full URL:

```text
http://localhost:3000/api/v1/tours?duration[gt]=5
```

Meaning:

```text
duration > 5
```

---

### Duration greater than or equal to 5

```text
GET /tours?duration[gte]=5
```

Meaning:

```text
duration >= 5
```

---

### Price less than 500

```text
GET /tours?price[lt]=500
```

Meaning:

```text
price < 500
```

---

### Price less than or equal to 500

```text
GET /tours?price[lte]=500
```

Meaning:

```text
price <= 500
```

---

# 7. Sorting

### Low → High

```text
GET /tours?sort=price
```

Meaning:

```text
price: lowest → highest
```

---

### High → Low

```text
GET /tours?sort=-price
```

Meaning:

```text
price: highest → lowest
```

---

### Multiple sorting fields

```text
GET /tours?sort=price,ratingsAverage
```

---

# 8. Field Limiting

### Only name and price

```text
GET /tours?fields=name,price
```

Meaning:

Return only:

```text
name
price
```

---

### Exclude a field

```text
GET /tours?fields=-description
```

Meaning:

Return everything except `description`.

---

# 9. Pagination

### Page 1

```text
GET /tours?page=1&limit=5
```

### Page 2

```text
GET /tours?page=2&limit=5
```

Meaning:

```text
page = 2
limit = 5 tours per page
```

---

# 10. Combining Query Features

You can combine filtering, sorting, field limiting and pagination.

Example:

```text
GET /tours?difficulty=easy&duration[gte]=5&sort=-price&fields=name,price,difficulty&page=1&limit=5
```

This means:

```text
difficulty = easy
AND
duration >= 5
AND
sort by price descending
AND
return only name, price and difficulty
AND
page 1
AND
5 results per page
```

---

# 11. Middleware Meaning

## protect

```js
authController.protect
```

Meaning:

```text
Is the user logged in?
```

If not logged in:

```text
❌ Access denied
```

If logged in:

```text
✅ next()
```

---

## restrictTour("admin")

```js
authController.restrictTour("admin")
```

Meaning:

```text
Is the logged-in user's role = admin?
```

If:

```text
role = admin
```

Then:

```text
✅ next()
```

Otherwise:

```text
❌ Access denied
```

---

## restrictTour("user")

```js
authController.restrictTour("user")
```

Meaning:

```text
Is the logged-in user's role = user?
```

---

# 12. Complete API Summary

| Method | URL                           | Authentication | Role             |
| ------ | ----------------------------- | -------------- | ---------------- |
| POST   | `/auth/singup`                | ❌              | —                |
| POST   | `/auth/login`                 | ❌              | —                |
| POST   | `/auth/forgotPassword`        | ❌              | —                |
| PATCH  | `/auth/resetPassword/:token`  | ❌              | —                |
| PATCH  | `/auth/updatePassword`        | ✅              | Logged in        |
| GET    | `/users`                      | ❌ / ⚠️         | Depends on route |
| PATCH  | `/users`                      | ✅              | Logged in        |
| DELETE | `/users`                      | ✅              | Logged in        |
| POST   | `/users/activeUser`           | ❌              | —                |
| GET    | `/tours`                      | ✅              | Logged in        |
| POST   | `/tours`                      | ✅              | Admin            |
| GET    | `/tours/:id`                  | ❌              | —                |
| PATCH  | `/tours/:id`                  | ✅              | Admin            |
| DELETE | `/tours/:id`                  | ✅              | Admin            |
| GET    | `/tours/getTop5CheapestPlace` | ❌              | —                |
| GET    | `/tours/getToursStats`        | ❌              | —                |
| GET    | `/tours/getMonthlyPlan/:year` | ❌              | —                |
| POST   | `/review/addReviews`          | ✅              | Logged in        |
| GET    | `/review/showReview`          | ✅              | Logged in        |
| POST   | `/tours/:tourID/review`       | ✅              | User             |

---

# Important Notes

### 1. `singup`

You currently use:

```text
/auth/singup
```

Usually this is spelled:

```text
/auth/signup
```

If you change it, also change the route in your code.

---

### 2. Nested Review URL

Your current route is:

```js
router.route("/:tourID")
```

but your comment says:

```text
POST /tour/id/review
```

These don't match.

For a nested review route, use:

```js
router
  .route("/:tourID/review")
  .post(
    authController.protect,
    authController.restrictTour("user"),
    reviewController.addReviews
  );
```

---

### 3. User `/` routes

You currently have:

```js
router.route("/").get(userController.getAllUser);

router
  .route("/")
  .patch(authController.protect, userController.updateUser)
  .delete(authController.protect, userController.deleteUser)
  .get(authController.protect, userController.getSpecificUser);
```

There are **two GET `/` routes**. This can cause confusing behavior.

You should eventually separate them, for example:

```text
GET /users
```

→ Get all users

and:

```text
GET /users/me
```

→ Get currently logged-in user

That will make your API much easier to understand.
