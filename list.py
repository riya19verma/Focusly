import kivy
kivy.require('2.3.1')
 
from kivy.app import App 
from kivy.uix.label import Label 
from kivy.uix.button import Button

from kivy.uix.boxlayout import BoxLayout
from kivy.core.image import Image as CoreImage
from kivy.uix.gridlayout import GridLayout

from kivy.properties import StringProperty
from kivy.lang import Builder

from kivy.properties import BooleanProperty
from kivy.uix.floatlayout import FloatLayout

from datetime import datetime
from datetime import date

from kivy.uix.textinput import TextInput
from kivy.graphics import Color, Rectangle

import json

# Load KV file manually (if not named main.kv)
Builder.load_file('hellokivy.kv')

days = {0 : "MON", 1 : "TUE", 2 : "WED", 3 : "THU", 4 : "FRI", 5 : "SAT", 6 : "SUN"}
months = {1 : "JAN", 2 : "FEB", 3 : "MAR", 4 : "APR", 5 : "MAY", 6 : "JUN",
          7 : "JUL", 8 : "AUG", 9 : "SEP", 10 : "OCT", 11 : "NOV", 12 : "DEC"}
days_in_month = {1 : 31, 2 : 28, 3 : 31, 4 : 30, 5 : 31, 6 : 30,
                 7 : 31, 8 : 31, 9 : 30, 10 : 31, 11 : 30, 12 : 31}
current_date = datetime.now()
current_day = current_date.day
current_month = current_date.month
current_year = current_date.year
current_weekday = date(current_year,current_month,1).weekday()  # 0 is Monday, 6 is Sunday

class RootWidget(FloatLayout):
    bg_source = StringProperty('bg6.jpg')  # Default background image
    show_images = BooleanProperty(False)
    current_date = StringProperty()
    selected_date = StringProperty()
    show_plans = BooleanProperty(False)
    save = BooleanProperty(False)

    def toggle_images(self):
        self.show_images = not self.show_images

    def toggle_plans(self):
        self.show_plans = not self.show_plans
        if(not self.show_plans):
            self.paste_diary()
        self.save = not self.save
        
    def change_background(self,img_name):
        self.bg_source = img_name
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_date = datetime.now().strftime("%d, %B '%Y")  # Format: Day-Month-Year
        self.calendar = GridLayout(cols=7, spacing=5, padding=5, size_hint=(0.3, 1))
        self.build_calendar()
        self.add_widget(self.calendar)

    def build_calendar(self):

        self.calendar.size_hint = (None, None)
        self.calendar.size = 400,300
        day_count = days_in_month[current_month] 
        if current_month == 2 and (current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0)):
            day_count = 29
        for i in range(7):
            lbl = Label(text=days[i], bold=True)
            self.calendar.add_widget(lbl)

        for i in range(0, day_count + current_weekday):
            if i >= current_weekday:
                btn = Button(text=f"{i}")
                btn.bind(on_press=self.on_button_press)
                self.calendar.add_widget(btn)
            else:
                self.calendar.add_widget(Label())

    def on_button_press(self, instance):
        current_day = int(instance.text)
        selected = date(current_year, current_month, current_day)
        self.selected_date = selected.strftime("%d-%m-%Y")
        self.current_date = self.selected_date
        self.paste_diary()
        print(f"Selected date: {self.selected_date}")
    
    def save_diary(self):
        if not self.selected_date:
            self.selected_date = datetime.now().strftime("%d-%m-%Y")

        try:
            with open("diary.json", "r") as diary_file:
                content = json.load(diary_file)
        except FileNotFoundError:
            content = {}
        # Add/update an entry
        content[self.selected_date] = self.ids.Diary.text

        # Save back to file
        with open('diary.json', 'w') as f:
            json.dump(content, f, indent=4)

    def paste_diary(self):
        if not self.selected_date:
            self.selected_date = datetime.now().strftime("%d-%m-%Y")
        try:
            with open("diary.json", "r") as diary_file:
                content = json.load(diary_file)
            self.ids.Diary.text = content.get(self.selected_date,"No diary entries found.")
        except FileNotFoundError:
            self.ids.Diary.text = "No diary entries found."

class MyApp(App):
    def build(self):
        return RootWidget()

if __name__ == '__main__':
    MyApp().run()
