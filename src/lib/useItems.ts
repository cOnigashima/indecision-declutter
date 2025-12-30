import { db, type Item, type UrgencyLevel, type ItemStatus } from './db';
import { v4 as uuidv4 } from 'uuid';
import { liveQuery } from 'dexie';
import { ref, onMounted, onUnmounted } from 'vue';

export function useItems() {
    const addItem = async (imageData: string, urgency: UrgencyLevel) => {
        // Auto-set status based on urgency (FR-5)
        // 0(Keep)/1(Hesitate) -> hold
        // 2(Want)/3(Now) -> want
        const status: ItemStatus = urgency >= 2 ? 'want' : 'hold';

        const newItem: Item = {
            id: uuidv4(),
            imageData,
            urgency,
            status,
            blockers: [],
            memoryNote: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await db.items.add(newItem);
        return newItem.id;
    };

    // Simple composable to subscribe to a dexie query
    const useLiveQuery = <T>(querier: () => Promise<T> | T, initialValue: T) => {
        const value = ref<T>(initialValue) as any;
        const observable = liveQuery(querier);

        let subscription: any;
        onMounted(() => {
            subscription = observable.subscribe({
                next: (result: T) => { value.value = result; },
                error: (error: any) => console.error(error)
            });
        });
        onUnmounted(() => {
            if (subscription) subscription.unsubscribe();
        });
        return value;
    };

    const updateItem = async (item: Item) => {
        await db.items.put(item);
    };

    const deleteItem = async (id: string) => {
        await db.items.delete(id);
    };

    return { addItem, useLiveQuery, updateItem, deleteItem };
}
