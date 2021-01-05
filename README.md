# Computer Graphics III

## Installation

Notwendige Pakete installieren:

``` bash
npm install
```

Webserver starten:

``` bash
node app.js
```

Projekt aufrufen unter: http://localhost:8080

## Bezier

## Quaternionen

Rotation von Objekt durch Interpolation zwischen vom Nutzer definierten Quaternionen.

Hinweise:

- Die Eingabemaske fuer die Quaternionen erwartet eine Rotationsachse {x, y, z} ∈ [0, 10], die dann normiert wird und einen Rotationswinkel Θ ∈ [0, 2π].
- Die aktuelle Rotationsachse wird in Blau angezeigt, Startorientierung in der Rotationsebene in gruen und die Endorierntierung in der Rotationsebene in blau. Der Rotationswinkel Θ wird durch den roten Pfeil indiziert.
- Neben der Figur werden die Quaternionen in ihrem eigenen Koordinatensystem angezeigt:
  - Ausgangsquaternion in gruen
  - Endquaternion in blau
  - Aktuelles quaternion in rot (Interpolationspfad)
  - Achsen tragen i,j und k auf wobei der Ursprung s = 1 darstellt (0 wird nicht angezeigt)
  - fuer alle Quaternionen gilt: i² + j² + k² + s² = 1
  - alle Quaternionen werden auf das Kugelaeussere projiziert, da nur fuer s = 0 die Quaternionen auf der Kugel liegen
  - der erste Interpolationspfad wird nicht projiziiert, da dort Start und Ende auf einer Achse (da s = 1).

## Cloth
