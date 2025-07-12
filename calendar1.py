from datetime import datetime
from datetime import date
from kivy.app import App
from kivy.properties import StringProperty
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
from kivy.lang import Builder

Builder.load_file('calendar.kv')

days = {0 : "MON", 1 : "TUE", 2 : "WED", 3 : "THU", 4 : "FRI", 5 : "SAT", 6 : "SUN"}
months = {1 : "JAN", 2 : "FEB", 3 : "MAR", 4 : "APR", 5 : "MAY", 6 : "JUN",
          7 : "JUL", 8 : "AUG", 9 : "SEP", 10 : "OCT", 11 : "NOV", 12 : "DEC"}
days_in_month = {0 : 31, 1 : 28, 2 : 29, 3 : 31, 4 : 30, 5 : 31, 6 : 30,
                 7 : 31, 8 : 31, 9 : 30, 10 : 31, 11 : 30, 12 : 31}
current_date = datetime.now()
current_day = current_date.day
current_month = current_date.month
current_year = current_date.year
current_weekday = date(current_year,current_month,1).weekday()  # 0 is Monday, 6 is Sunday

class ButtonTable(GridLayout):
    def __init__(self, rows=3, cols=3, **kwargs):
        super().__init__(**kwargs)
        self.rows = rows
        self.cols = cols
        self.spacing = 5
        self.padding = 10
        self.size_hint = (None,None)
        self.size = (300, 200)
        selected_date = StringProperty()

        for i in range(7):
            lbl = Label(text=days[i], bold=True)
            self.add_widget(lbl)

        for i in range(0,(rows-1) * (cols-1) + 1 + current_weekday):
            if i >= current_weekday:
                btn = Button(text=f"{i}")
                btn.bind(on_press=self.on_button_press)
                self.add_widget(btn)
            else:
                self.add_widget(Label())

    def on_button_press(self, instance):
        current_day = int(instance.text)
        global selected_date
        selected_date = date(current_year, current_month, current_day)
        selected_date = selected_date.strftime("%d-%m-%Y")
        print(f"Selected date: {selected_date}")

class MainApp(App):
    def build(self):
        layout = BoxLayout()
        table = ButtonTable(rows=6, cols=7)  # 6x7 grid
        layout.add_widget(table)
        return layout

if __name__ == '__main__':
    MainApp().run()
