// ===========================================================
// API FEATURES
// ===========================================================

// This class separates all API features into individual methods.
// We can reuse these methods for other APIs as well.

// query      -> Mongoose query
// queryString -> Query parameters coming from API URL

class APIFetures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // ===========================================================
  // 1) FILTER
  // ===========================================================

  /**
   * FILTER
   *
   * @query
   * { duration: 5, difficulty: "easy" }
   *
   * @url
   * http://localhost:3000/api/v1/tours?duration=5&difficulty=easy
   */

  /**
   * Get all tours
   *
   * @api
   * http://localhost:3000/api/v1/tours
   *
   * @method GET
   */

  /**
   * @extra_code
   *
   * const newTour = await Tour.find({
   *   duration: 5,
   *   difficulty: "easy",
   * });
   *
   * const newTour = await Tour.find()
   *   .where("duration")
   *   .equals(5)
   *   .where("difficulty")
   *   .equals("easy");
   */

  // ===========================================================
  // 2) ADVANCED FILTERING
  // ===========================================================

  /**
   * ADVANCED FILTERING
   *
   * MongoDB comparison operators:
   *
   * $lt  -> Less than
   * $lte -> Less than or equal
   * $gt  -> Greater than
   * $gte -> Greater than or equal
   *
   * @url
   * http://localhost:3000/api/v1/tours?duration[gte]=5
   *
   * Example:
   *
   * {
   *   duration: {
   *     $gte: 5
   *   }
   * }
   */

  filter() {
    // Copy query string so the original object is not modified

    const queryObj = { ...this.queryString };

    // Fields that are not used for filtering

    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
    ];

    // Remove excluded fields

    excludedFields.forEach((el) => delete queryObj[el]);

    // Convert object to string

    const queryStr = JSON.stringify(queryObj);

    // Convert:
    // { duration: { gte: 5 } }
    // into:
    // { duration: { $gte: 5 } }

    const replaceQueryStr = queryStr.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`,
    );

    // Convert string back into object

    const filterObject = JSON.parse(replaceQueryStr);

    // Apply filter to Mongoose query

    this.query = this.query.find(filterObject);

    return this;
  }

  // ===========================================================
  // 3) SORT
  // ===========================================================

  /**
   * SORT
   *
   * Ascending:
   * ?sort=price
   *
   * Descending:
   * ?sort=-price
   *
   * Multiple fields:
   * ?sort=-createdAt,-price,name
   *
   * This sorting method works with any field in the document.
   */

  sort() {
    if (this.queryString.sort) {
      // Convert:
      // "price,-ratingsAverage"
      // into:
      // "price -ratingsAverage"

      const sortBy = this.queryString.sort
        .split(",")
        .join(" ");

      this.query = this.query.sort(sortBy);
    } else {
      // Default sorting:
      // Newest data first

      this.query = this.query.sort("-createAt");
    }

    return this;
  }

  // ===========================================================
  // 4) FIELD LIMITING
  // ===========================================================

  /**
   * FIELD LIMITING
   *
   * @api
   * http://localhost:3000/api/v1/tours?fields=name,duration,price
   *
   * Only selected fields will be returned.
   */

  field() {
    if (this.queryString.fields) {
      // Convert:
      // "name,duration,price"
      // into:
      // "name duration price"

      const fields = this.queryString.fields
        .split(",")
        .join(" ");

      this.query = this.query.select(fields);
    } else {
      // Exclude __v by default

      this.query = this.query.select("-__v");
    }

    return this;
  }

  // ===========================================================
  // 5) PAGINATION
  // ===========================================================

  /**
   * PAGE & LIMIT
   *
   * @api
   * http://localhost:3000/api/v1/tours?page=2&limit=5
   *
   * page  -> Which page to display
   * limit -> How many documents per page
   * skip  -> How many documents to skip
   */

  pageLimit() {
    // Default page = 1

    const page = this.queryString.page * 1 || 1;

    // Default limit = 100

    const limit = this.queryString.limit * 1 || 100;

    // Calculate documents to skip
    // Example:
    // page = 2
    // limit = 5
    // skip = (2 - 1) * 5 = 5

    const skip = (page - 1) * limit;

    // Apply pagination

    this.query = this.query
      .skip(skip)
      .limit(limit);

    return this;
  }
}

// ===========================================================
// EXPORT API FEATURES
// ===========================================================

module.exports = APIFetures;