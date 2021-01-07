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
*Da WebGL unter Chrome/Chromium deutlich stabiler ist empfehlen wir die Verwendung dieser Browser*

## Bezier

Bezier-kurve zwischen den vier angezeigten Punkten.

### Animation

Die Punkte können beliebig verschoben werden und die Kurve passt sich immer automatisch an.
In der GUI kann mit dem Knopf `Animate` die Animation gestartet werden die den Casteljau-Algorithmus darstellt und die Kurve zeichnet. Der `AnimationProgress` kann auch per Hand verschoben werden um sich die Visualisierung an einer bestimmten Position anzugucken.

### Bernsteinpolynome

Im Hintergrund befinden sich die vier ersten Bernsteinpolynome mit jeweils einer Farbe. Die Bezierkurve nimmt jeweils die Farbe des Bernsteinpolynoms der momentan den größten Einfluss hat.

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

Die Simulation des Tuchs.

### Allgemein

Das Tuch besteht standardmäßig aus einer 20x20 Matrix an Partikeln. Falls die Performance nicht so gut ist kann dies in `/js/windows/clothWindow/clothWindow.js` bei der Konstante `CLOTH_SIZE` geändert werden. Außerdem einen hohen Maß an Realismus zu erreichen ist die Schrittweite an das delta t (vergangene Zeit seit dem letzten frame) gebunden. Dadurch verhält sich die Simulation zeitgemäß (wenn die fps-Zahl sinkt behält die Simulation trotzdem die Geschwindigkeit bei).

### Tuch- und Umgebungseinstellungen

Hier können allgemeine Tuch- und Umbebungseinstellungen vorgenommen werden. `Toughness` meint hierbei die Härte des Tuchs und gleichzeitig die Federkonstante. die Funktion der Biege- und Schärfedern kann am besten gezeigt werden wenn nur eine Ecke des Tuchs fixiert ist. Das Tuch verfält dann nicht in sich selbst sondern formt Falten.

### Integratoren und adaptive schrittweite

Weil die Partikel alle untereinander wegen den Federn Abhängigkeiten haben, wird nicht Partikelweise integriert, sondern es gibt eine Klasse, die den Zustand des Tuchs representiert, wo alle Partikel auf einmal integriert werden.

Es stehen zwei Integratoren zur Verfügung: Euler-Integrator und Runge-Kutta-Integrator. Standardmäßig ist der Runge-Kutta-Integrator eingestellt. Der Euler-Intergrator scheint ungeeignet für die Tuchsimulation zu sein, dennoch kann dieser ausgewählt werden. Die adaptive Schrittweite kann mit der Option `adaptive_step_size` an und aus gemacht werden. Wenn adaptive Schrittweite aus ist, werden so viele Schritte ausgeführt, wie es in `max_steps_per_frame` spezifiziert ist. In den Feldern `current_steps_per_frame` und `current_step_size` is jeweils zu sehen wie viele Schritte pro Frame ausgeführt werden und wie groß die Schritweite gerade ist. Wir haben uns entschieden die Fehlerfunktion als geometrischen Abstand zwischen zwei Tuchzuständen zu modellieren. Dies funktioniert an sich bei dem Runge-Kutta-Integrator, jedoch führt es bei "starken Turbulenzen" zu sehr kleinen Schrittweiten, weswegen `max_steps_per_frame` eingeführt werden musste, um die Schrittanzahl pro frame zu begrenzen. Bei dem Euler-Integrator liefert die Fehlerfunktion Werte bei denen nicht die maximale Schrittzahl pro Frame ausgenutzt wird, obwohl die Fehler ganz klar sehr groß sind. Der maximal zulässige Fehler kann in `max_error` eingestellt werden.

### Visualisationseinstellunngen
<<<<<<< HEAD

Hier können verschiedene Visualisierungen an und ausgemacht werden.
=======
Hier können verschiedene Visualisierungen an und ausgemacht werden.

Bei der Option `showParticles` werden die Partikel gefärbt, je nach dem wie groß die Gesamtkraft ist, die auf den Partikel wirkt. Je größer der betrag der Gesamtkraft, desto rötlicher wird der Partikel bemalt.
>>>>>>> fcd48eadc6c54cbde276d94e8b9aa2d5d2823589
