# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - heading "CMS Dashboard" [level=1] [ref=e4]
    - generic [ref=e5]:
      - text: "API:"
      - code [ref=e6]: /api
  - heading "Omzet (14 dagen)" [level=2] [ref=e8]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - heading "Categorieën" [level=2] [ref=e13]
      - generic [ref=e14]:
        - textbox "Naam" [ref=e15]
        - textbox "Slug" [ref=e16]
        - button "Toevoegen" [ref=e17]
      - list
    - generic [ref=e18]:
      - heading "Producten" [level=2] [ref=e20]
      - generic [ref=e21]:
        - textbox "Naam" [ref=e22]
        - textbox "Slug" [ref=e23]
        - textbox "SKU" [ref=e24]
        - spinbutton [ref=e25]
        - combobox [ref=e26]:
          - option "(categorie)" [selected]
        - button "Toevoegen" [ref=e27]
      - table [ref=e29]:
        - rowgroup [ref=e30]:
          - row "Naam SKU Prijs Acties" [ref=e31]:
            - cell "Naam" [ref=e32]
            - cell "SKU" [ref=e33]
            - cell "Prijs" [ref=e34]
            - cell "Acties" [ref=e35]
        - rowgroup
  - heading "Raw" [level=2] [ref=e37]
```