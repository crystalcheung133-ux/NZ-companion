# Travel Engine Integrity Failure Report

## FAIL

Blocking errors: 2  
Warnings: 0

## FAIL NAV_DESTINATION_MISSING

Stage: E3  
Entity: navigationAction / rental-booking-1:return  
Field: destination  
Related entity: rental-booking-1  
Message: Displayed navigation action has no destination.  
Recommended correction: Bind the action to the correct canonical role destination or suppress the action.

## FAIL BOOKING_RENTAL_RETURN_DESTINATION_MISSING

Stage: E4  
Entity: booking / rental-booking-1  
Field: returnNavigationDestination  
Message: Rental return navigation destination is required.  
Recommended correction: Supply the authoritative returnNavigationDestination; validation will not fabricate it.

## Machine-readable excerpt

```json
{
  "valid": false,
  "status": "FAIL",
  "blockingErrorCount": 2,
  "warningCount": 0,
  "errors": [
    {
      "stage": "E3",
      "code": "NAV_DESTINATION_MISSING",
      "severity": "error",
      "entityType": "navigationAction",
      "entityId": "rental-booking-1:return",
      "field": "destination",
      "relatedEntityId": "rental-booking-1"
    },
    {
      "stage": "E4",
      "code": "BOOKING_RENTAL_RETURN_DESTINATION_MISSING",
      "severity": "error",
      "entityType": "booking",
      "entityId": "rental-booking-1",
      "field": "returnNavigationDestination"
    }
  ]
}
```

No destination was fabricated and no alternate depot was silently reused.
