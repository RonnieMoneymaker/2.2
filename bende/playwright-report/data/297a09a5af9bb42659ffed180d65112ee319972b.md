# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - img [ref=e8]
    - heading "Inloggen bij CRM" [level=2] [ref=e11]
    - paragraph [ref=e12]: Webshop Customer Relationship Management
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: E-mailadres
        - generic [ref=e17]:
          - generic:
            - img
          - textbox "E-mailadres" [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]: Wachtwoord
        - generic [ref=e21]:
          - generic:
            - img
          - textbox "Wachtwoord" [ref=e22]
          - button [ref=e24] [cursor=pointer]:
            - img [ref=e25] [cursor=pointer]
    - button "Inloggen" [ref=e29] [cursor=pointer]
    - button "Demo inloggegevens gebruiken" [ref=e31] [cursor=pointer]
  - generic [ref=e32]:
    - generic [ref=e33]:
      - heading "Demo Accounts:" [level=3] [ref=e34]
      - generic [ref=e35]:
        - paragraph [ref=e36]:
          - strong [ref=e37]: "Admin:"
          - text: admin@webshop.nl / admin123
        - paragraph [ref=e38]:
          - strong [ref=e39]: "Manager:"
          - text: manager@webshop.nl / admin123
    - link "👥 Klant Login Portal →" [ref=e41] [cursor=pointer]:
      - /url: /customer-login
```