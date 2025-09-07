# noCodeDbApi

### Create Apps
`POST http://localhost:4441/no-code-db-api/apps`

```json
{
  "appsId": "ProductCatalog",
  "appsName": "Product Catalog Manager",
  "description": "A no-code database app that lets you easily organize, update, and showcase your product listings across stores and sales channels."
}
```
### Create Form Schema
`POST http://localhost:4441/no-code-db-api/form/schema`

```json
{
  "appsId": "ProductCatalog",
  "formId": "DistributeCenter",
  "description": "Create or edit a Distribution Center used for order routing, inventory, and shipping. Enter a unique center name.",
  "fields": {
    "distributeCenterId": {
      "fieldId": "distributeCenterId",
      "fieldType": "TEXT",
      "allowMultiple": false
    },
    "distributeCenterName": {
      "fieldId": "distributeCenterName",
      "fieldType": "TEXT",
      "allowMultiple": false
    }
  }
}
```
```json
{
  "appsId": "ProductCatalog",
  "formId": "Category",
  "description": "Create or edit a product category; supports hierarchy and display order.",
  "fields": {
    "categoryId": {
      "fieldId": "categoryId",
      "fieldType": "TEXT",
      "required": true
    },
    "name": {
      "fieldId": "name",
      "fieldType": "TEXT",
      "required": true
    },
    "description": {
      "fieldId": "description",
      "fieldType": "TEXT"
    }
  }
}
```
```json
{
  "appsId": "ProductCatalog",
  "formId": "Product",
  "description": "Create or edit a product, including variants, pricing, inventory by DC, and media.",
  "fields": {
      "productName": {
        "fieldId": "productName",
        "fieldType": "TEXT",
        "required": true
      },
      "productDescription": {
        "fieldId": "productDescription",
        "fieldType": "TEXT"
      },
      "sku": {
        "fieldId": "sku",
        "fieldType": "TEXT",
        "required": true,
        "unique": true
      },
      "isActive": {
        "fieldId": "isActive",
        "fieldType": "BOOLEAN",
        "default": true
      },
      "categoryId": {
        "fieldId": "categoryId",
        "fieldType": "REF_PICK_LIST",
        "refPickListId": "Category.categoryId",
        "allowMultiple": true
      },
      "inventoryByLocation": {
        "fieldId": "inventoryByLocation",
        "fieldType": "EMBED",
        "allowMultiple": true,
        "embeddedFormSchema": {
          "fields": {
            "distributionCenterId": {
              "fieldId": "distributionCenterId",
              "fieldType": "REF_PICK_LIST",
              "refPickListId": "DistributeCenter.distributionCenterId"
            },
            "onHand": {
              "fieldId": "onHand",
              "fieldType": "NUMERIC"
            },
            "reorderPoint": {
              "fieldId": "reorderPoint",
              "fieldType": "NUMERIC"
            },
            "reserved": {
              "fieldId": "reserved",
              "fieldType": "NUMERIC"
            }
          }
        }
      },
      "prices": {
        "fieldId": "prices",
        "fieldType": "EMBED",
        "embeddedFormSchema": {
          "fields": {
            "listPrice": {
              "fieldId": "listPrice",
              "fieldType": "EMBED",
              "embeddedFormSchema": {
                "fields" : {
                  "price" : {
                    "fieldId": "price",
                    "fieldType": "MONEY"
                  },
                  "effectiveFrom": {
                    "fieldId": "effectiveFrom",
                    "fieldType": "DATE"
                  },
                  "effectiveTo": {
                    "fieldId": "effectiveTo",
                    "fieldType": "DATE"
                  }
                }
              }
            },
            "salePrice": {
              "fieldId": "salePrice",
              "fieldType": "EMBED",
              "embeddedFormSchema": {
                "fields" : {
                  "price" : {
                    "fieldId": "price",
                    "fieldType": "MONEY"
                  },
                  "effectiveFrom": {
                    "fieldId": "effectiveFrom",
                    "fieldType": "DATE"
                  },
                  "effectiveTo": {
                    "fieldId": "effectiveTo",
                    "fieldType": "DATE"
                  }
                }
              }
            }
          }
        }
      }
    }
  }

```
### Create Form Data
`POST http://localhost:4441/no-code-db-api/form/data`
```json
{
  "appsId": "ProductCatalog",
  "formId": "DistributeCenter",
  "fields": {
    "distributeCenterId": "ADC",
    "distributeCenterName": "Amazon DC"
  }
}
```
```json
{
  "appsId": "ProductCatalog",
  "formId": "Category",
  "fields": {
    "categoryId": "CAT-001",
    "name": "Baking Ingredients",
    "description": "Includes flour, sugar, cocoa powder, and other essential baking supplies."
  }
}
```
```json
{
  "appsId": "ProductCatalog",
  "formId": "Product",
  "description": "Create or edit a product, including variants, pricing, inventory by DC, and media.",
  "fields": {
    "productName": "All-Purpose Flour",
    "productDescription": "High-quality all-purpose flour for baking and cooking.",
    "sku": "FLR-001",
    "isActive": true,
    "categoryId": ["68b251af2ea43a559aaa4e7b"],
    "inventoryByLocation": [
      {
        "distributionCenterId": "68b24e14c6292b24e0c3cabc",
        "onHand": 500,
        "reorderPoint": 100,
        "reserved": 50
      }
    ],
    "prices": {
      "listPrice": {
        "price": {
          "fractionDigits": 2,
          "currencyCode": "USD",
          "centAmount": 1299
        },
        "effectiveFrom": "2025-01-01",
        "effectiveTo": "2025-06-01"
      },
      "salePrice": {
        "price": {
          "fractionDigits": 2,
          "currencyCode": "USD",
          "centAmount": 999
        },
        "effectiveFrom": "2025-08-01",
        "effectiveTo": "2025-08-31"
      }
    }
  }
}
```
### List Apps
`GET http://localhost:4441/no-code-db-api/apps`

### List Form Schema
`GET http://localhost:4441/no-code-db-api/apps/ProductCatalog/schemas`


where ProductCatalog is appsId

### List Form Data
`GET http://localhost:4441/no-code-db-api/form/data`

```json
{
    "appsId" : "ProductCatalog",
    "formId" : "Product"
}
```

### Update Apps
`PUT http://localhost:4441/no-code-db-api/apps`

```json
{
  "appsId": "ProductCatalog",
  "appsName": "Product Catalog Manager",
  "description": "update whatever field except appsId and appsName",
   "_id": "689e455481192e5ce09ea1d7"
}

```
where _id is object id

### Update Form Schema
`PUT http://localhost:4441/no-code-db-api/form/schema`

```json
{
   "_id" : "689f7f008584e83b8cfd2499",
  "appsId": "ProductCatalog",
  "formId": "Product",
  "description": "Create or edit a product, including variants, pricing, inventory by DC, and media.",
  "fields": {
      "productName": {
        "fieldId": "productName",
        "fieldType": "TEXT",
        "required": true
      },
      "productDescription": {
        "fieldId": "productDescription",
        "fieldType": "TEXT"
      },
      "sku": {
        "fieldId": "sku",
        "fieldType": "TEXT",
        "required": true,
        "unique": true
      },
      "isActive": {
        "fieldId": "isActive",
        "fieldType": "BOOLEAN",
        "default": true
      },
      "categoryId": {
        "fieldId": "categoryId",
        "fieldType": "REF_PICK_LIST",
        "refPickListId": "Category.categoryId",
        "allowMultiple": true
      },
      "inventoryByLocation": {
        "fieldId": "inventoryByLocation",
        "fieldType": "EMBED",
        "allowMultiple": true,
        "embeddedFormSchema": {
          "fields": {
            "distributionCenterId": {
              "fieldId": "distributionCenterId",
              "fieldType": "REF_PICK_LIST",
              "refPickListId": "DistributeCenter.distributionCenterId"
            },
            "onHand": {
              "fieldId": "onHand",
              "fieldType": "NUMERIC"
            },
            "reorderPoint": {
              "fieldId": "reorderPoint",
              "fieldType": "NUMERIC"
            },
            "reserved": {
              "fieldId": "reserved",
              "fieldType": "NUMERIC"
            }
          }
        }
      },
      "prices": {
        "fieldId": "prices",
        "fieldType": "EMBED",
        "embeddedFormSchema": {
          "fields": {
            "listPrice": {
              "fieldId": "listPrice",
              "fieldType": "EMBED",
              "embeddedFormSchema": {
                "fields" : {
                  "price" : {
                    "fieldId": "price",
                    "fieldType": "MONEY"
                  },
                  "effectiveFrom": {
                    "fieldId": "effectiveFrom",
                    "fieldType": "DATE"
                  },
                  "effectiveTo": {
                    "fieldId": "effectiveTo",
                    "fieldType": "DATE"
                  }
                }
              }
            },
            "salePrice": {
              "fieldId": "salePrice",
              "fieldType": "EMBED",
              "embeddedFormSchema": {
                "fields" : {
                  "price" : {
                    "fieldId": "price",
                    "fieldType": "MONEY"
                  },
                  "effectiveFrom": {
                    "fieldId": "effectiveFrom",
                    "fieldType": "DATE"
                  },
                  "effectiveTo": {
                    "fieldId": "effectiveTo",
                    "fieldType": "DATE"
                  }
                }
              }
            }
          }
        }
      }
    }
  }

```
where _id is object id

### Update Form Data
`PUT http://localhost:4441/no-code-db-api/form/data`

```json
{
    "appsId": "ProductCatalog",
    "formId": "Product",
    "fields": {
        "productName": "All-Purpose Flour Modify again",
        "productDescription": "High-quality all-purpose flour for baking and cooking.",
        "sku": "FLR-001",
        "isActive": true,
        "categoryId": [
            "68b251af2ea43a559aaa4e7b"
        ],
        "inventoryByLocation": [
            {
                "distributionCenterId": "68b24e14c6292b24e0c3cabc",
                "onHand": 500,
                "reorderPoint": 100,
                "reserved": 50
            }
        ],
        "prices": {
            "listPrice": {
                "price": {
                    "fractionDigits": 2,
                    "currencyCode": "USD",
                    "centAmount": 1299
                },
                "effectiveFrom": "2025-01-01",
                "effectiveTo": "2025-06-01"
            },
            "salePrice": {
                "price": {
                    "fractionDigits": 2,
                    "currencyCode": "USD",
                    "centAmount": 999
                },
                "effectiveFrom": "2025-08-01",
                "effectiveTo": "2025-08-31"
            }
        }
    },
    "_id": "68b273c02ea43a559aaa4e7d"
}
```
where _id is object id

### Query Form Data
`POST http://localhost:4441/no-code-db-api/form/data/query`

Available operator :
```java
public enum Operator {
    EQUALS,
    NOT_EQUALS,
    GREATER_THAN,
    GREATER_THAN_OR_EQUAL,
    LESS_THAN,
    LESS_THAN_OR_EQUAL,
    IN,
    LIKE,
    AND,
    OR
}
```
Request Json
```json
{
       "appsId": "ProductCatalog",
       "formId": "Product",
       "filter": {
         "field": "inventoryByLocation.onHand",
         "operator": "GREATER_THAN",
         "value": 300
       }
  }
```
```json
{
  "appsId": "ProductCatalog",
  "formId": "Product",
  "filter": {
    "field": "productName",
    "operator": "EQUALS",
    "value": "All-Purpose Flour"
  }
}
```
```json
{
       "appsId": "ProductCatalog",
       "formId": "Product",
       "aggregation": {
           "type": "COUNT"
       }
  }
```







