# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class Contract(gl.Contract):
    counter: u256
    notes: TreeMap[u256, str]

    def __init__(self):
        self.counter = u256(0)
        # notes is automatically initialized as an empty TreeMap — DO NOT assign here (Rule 2)

    @gl.public.write
    def add_note(self, text: str):
        self.notes[self.counter] = text
        self.counter += u256(1)

    @gl.public.view
    def get_note(self, idx: u256) -> str:
        return self.notes[idx]

    @gl.public.view
    def get_counter(self) -> u256:
        return self.counter
